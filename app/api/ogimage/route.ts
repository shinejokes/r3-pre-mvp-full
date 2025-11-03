// app/api/ogimage/route.ts

import { NextRequest } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";
import { createCanvas, registerFont } from "canvas";
import path from "path";
import process from "process";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 0) Register custom font so text renders on Vercel (no more □□□)
const fontPath = path.join(process.cwd(), "fonts", "NotoSans-Regular.ttf");

registerFont(fontPath, {
  family: "R3Font",
  weight: "regular",
});

export async function GET(req: NextRequest) {
  // 1) Read shareId from query (?shareId=F6C8uDm)
  const { searchParams } = new URL(req.url);
  const shareCode = searchParams.get("shareId"); // this is ref_code in r3_shares

  if (!shareCode) {
    return new Response("Missing shareId", { status: 400 });
  }

  // 2) Init Supabase client
  const supabase = supabaseServer();

  // 3) Fetch the share row from r3_shares
  //    We want BOTH:
  //     - numeric id   (e.g. 25)
  //     - title        (text user wrote)
  //
  //    SELECT id, title FROM r3_shares WHERE ref_code = shareCode LIMIT 1
  let numericId: number | null = null;
  let originalTitle = "(no title)";

  {
    const { data, error } = await supabase
      .from("r3_shares")
      .select("id, title")
      .eq("ref_code", shareCode)
      .maybeSingle();

    if (error) {
      console.error("Error fetching r3_shares:", error.message);
    }

    if (data) {
      // Example data: { id: 25, title: "이 영상 꼭 보세요..." }
      if (typeof data.id === "number") {
        numericId = data.id;
      }
      if (data.title) {
        originalTitle = data.title;
      }
    }
  }

  // 4) Clean title for display (ASCII fallback so we don't depend on Korean glyphs yet)
  //    We will keep only printable ASCII for now.
  const asciiOnly = originalTitle
    .split("")
    .filter((ch) => ch.charCodeAt(0) >= 32 && ch.charCodeAt(0) <= 126)
    .join("");

  let titleForDisplay =
    asciiOnly.trim().length > 0 ? asciiOnly.trim() : "(no title)";

  // shorten long titles so they fit one line
  const maxLen = 40;
  if (titleForDisplay.length > maxLen) {
    titleForDisplay = titleForDisplay.slice(0, maxLen - 3) + "...";
  }

  // 5) Count hits from r3_hits
  //    IMPORTANT: we count by numeric share_id (FK), not ref_code string.
  let viewsCount = 0;

  if (numericId !== null) {
    const { count, error } = await supabase
      .from("r3_hits")
      .select("*", { count: "exact", head: true })
      .eq("share_id", numericId); // <-- numericId is the FK target

    if (error) {
      console.error("Error counting hits:", error.message);
    }

    if (typeof count === "number") {
      viewsCount = count;
    }
  } else {
    // If we couldn't find the share row, leave viewsCount=0
    // and titleForDisplay="(no title)"
    console.warn(
      `[ogimage] No share row for ref_code=${shareCode}, so views=0`
    );
  }

  // 6) Draw OG image using node-canvas
  const width = 1200;
  const height = 630;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // background (white) + border (light gray)
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#cccccc";
  ctx.lineWidth = 8;
  ctx.strokeRect(0, 0, width, height);

  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";

  // Header / service name
  ctx.font = "bold 72px 'R3Font'";
  ctx.fillText("R3 pre-MVP", width / 2, 180);

  // Title line (ASCII fallback / trimmed)
  ctx.font = "48px 'R3Font'";
  ctx.fillText(titleForDisplay, width / 2, 260);

  // Share ID line (the human-facing short code, e.g. F6C8uDm)
  ctx.font = "40px 'R3Font'";
  ctx.fillText(`Share ID: ${shareCode}`, width / 2, 340);

  // Views line (actual count from r3_hits)
  ctx.font = "40px 'R3Font'";
  ctx.fillText(`Views: ${viewsCount}`, width / 2, 400);

  // Footer: domain / project branding
  ctx.fillStyle = "#666666";
  ctx.font = "36px 'R3Font'";
  ctx.fillText("r3-pre-mvp-full", width / 2, 480);

  // 7) Export PNG and respond with no-cache headers
  const pngBuffer = canvas.toBuffer("image/png");
  const pngBytes = new Uint8Array(pngBuffer);

  return new Response(pngBytes, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control":
        "no-store, no-cache, must-revalidate, max-age=0, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "x-vercel-cache": "MISS",
    },
  });
}
