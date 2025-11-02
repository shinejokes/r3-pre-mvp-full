// app/api/ogimage/route.ts

import { NextRequest } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";
import { createCanvas } from "canvas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // 1) Read shareId from query
  const { searchParams } = new URL(req.url);
  const shareId = searchParams.get("shareId");

  if (!shareId) {
    return new Response("Missing shareId", { status: 400 });
  }

  // 2) Init Supabase
  const supabase = supabaseServer();

  // 3) Fetch title from r3_shares (ref_code == shareId)
  // We'll still fetch it, but we won't directly render it if it's non-English.
  // We'll generate a safe English fallback line for display.
  let originalTitle = "(no title)";
  {
    const { data, error } = await supabase
      .from("r3_shares")
      .select("title")
      .eq("ref_code", shareId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching title:", error.message);
    }

    if (data && data.title) {
      originalTitle = data.title;
    }
  }

  // ---- English-safe display line for the title area ----
  // Option A: just show a generic English line such as "Shared content"
  // Option B: try to include part of the original title (truncated),
  //           but only ASCII characters.
  //
  // I'll do Option B: keep only ASCII printable chars from originalTitle.
  // If nothing remains, fall back to "Shared content".
  const asciiOnly = originalTitle
    .split("")
    .filter(ch => ch.charCodeAt(0) >= 32 && ch.charCodeAt(0) <= 126)
    .join("");

  let titleForDisplay =
    asciiOnly.trim().length > 0 ? asciiOnly.trim() : "Shared content";

  // Shorten it so it fits nicely
  const maxLen = 40;
  if (titleForDisplay.length > maxLen) {
    titleForDisplay = titleForDisplay.slice(0, maxLen - 3) + "...";
  }

  // 4) Count views from r3_hits (share_id == shareId)
  let viewsCount = 0;
  {
    const { count, error } = await supabase
      .from("r3_hits")
      .select("*", { count: "exact", head: true })
      .eq("share_id", shareId);

    if (error) {
      console.error("Error counting hits:", error.message);
    }

    if (typeof count === "number") {
      viewsCount = count;
    }
  }

  // 5) Draw the OG image using node-canvas
  const width = 1200;
  const height = 630;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Background: white, with light gray border
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#cccccc";
  ctx.lineWidth = 8;
  ctx.strokeRect(0, 0, width, height);

  // Centered black text
  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";

  // Header: service label
  ctx.font = "bold 72px sans-serif";
  ctx.fillText("R3 pre-MVP", width / 2, 180);

  // Title (ASCII-only fallback)
  ctx.font = "48px sans-serif";
  ctx.fillText(titleForDisplay, width / 2, 280);

  // ShareId line
  ctx.font = "40px sans-serif";
  ctx.fillText(`Share ID: ${shareId}`, width / 2, 360);

  // Views line
  ctx.font = "40px sans-serif";
  ctx.fillText(`Views: ${viewsCount}`, width / 2, 420);

  // Footer (domain / project name)
  ctx.fillStyle = "#666666";
  ctx.font = "36px sans-serif";
  ctx.fillText("r3-pre-mvp-full", width / 2, 500);

  // 6) Export PNG as Uint8Array for Response
  const pngBuffer = canvas.toBuffer("image/png");
  const pngBytes = new Uint8Array(pngBuffer);

  return new Response(pngBytes, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}
