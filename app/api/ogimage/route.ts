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

  // 2) Supabase client
  const supabase = supabaseServer();

  // 3) Fetch title from r3_shares (ref_code == shareId)
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

  // sanitize to ASCII-only so it renders on Vercel without Korean font
  const asciiOnly = originalTitle
    .split("")
    .filter(ch => ch.charCodeAt(0) >= 32 && ch.charCodeAt(0) <= 126)
    .join("");

  let titleForDisplay =
    asciiOnly.trim().length > 0 ? asciiOnly.trim() : "Shared content";

  // shorten for layout
  const maxLen = 40;
  if (titleForDisplay.length > maxLen) {
    titleForDisplay = titleForDisplay.slice(0, maxLen - 3) + "...";
  }

  // 4) Count hits from r3_hits (share_id == shareId)
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

  // 5) Draw image via node-canvas
  const width = 1200;
  const height = 630;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // white background + light gray border
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#cccccc";
  ctx.lineWidth = 8;
  ctx.strokeRect(0, 0, width, height);

  // text (centered)
  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";

  // big header (use pure ASCII to avoid font issues)
  ctx.font = "bold 72px sans-serif";
  ctx.fillText("R3 pre-MVP", width / 2, 180);

  // the content/title
  ctx.font = "48px sans-serif";
  ctx.fillText(titleForDisplay, width / 2, 280);

  // shareId
  ctx.font = "40px sans-serif";
  ctx.fillText(`Share ID: ${shareId}`, width / 2, 360);

  // views
  ctx.font = "40px sans-serif";
  ctx.fillText(`Views: ${viewsCount}`, width / 2, 420);

  // footer
  ctx.fillStyle = "#666666";
  ctx.font = "36px sans-serif";
  ctx.fillText("r3-pre-mvp-full", width / 2, 500);

  // 6) Convert to PNG bytes
  const pngBuffer = canvas.toBuffer("image/png");
  const pngBytes = new Uint8Array(pngBuffer);

  // 7) Strong no-cache headers
  return new Response(pngBytes, {
    status: 200,
    headers: {
      "Content-Type": "image/png",

      // Strong no-cache for browser + proxies
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",

      // Hint to Vercel/CDN that this shouldn't be reused
      "x-vercel-cache": "MISS",
    },
  });
}
