// app/api/ogimage/route.ts

import { NextRequest } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";
import { createCanvas, registerFont } from "canvas";
import path from "path";
import process from "process";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 0) 폰트 등록
//   - Vercel 서버 환경에서도 동작하도록, 경로를 process.cwd() 기준으로 잡습니다.
//   - 우리가 프로젝트 루트에 /fonts/NotoSans-Regular.ttf 를 넣었다는 전제.
const fontPath = path.join(process.cwd(), "fonts", "NotoSans-Regular.ttf");

// registerFont는 try/catch로 감싸도 되지만
// 여기서는 그냥 시도하게 둬도 무방합니다.
registerFont(fontPath, {
  family: "R3Font",
  weight: "regular",
});

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

  // sanitize to ASCII-only so that we don't rely on Korean glyphs yet
  const asciiOnly = originalTitle
    .split("")
    .filter(ch => ch.charCodeAt(0) >= 32 && ch.charCodeAt(0) <= 126)
    .join("");

  let titleForDisplay =
    asciiOnly.trim().length > 0 ? asciiOnly.trim() : "Shared content";

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

  // 5) Draw the OG image on node-canvas
  const width = 1200;
  const height = 630;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // border
  ctx.strokeStyle = "#cccccc";
  ctx.lineWidth = 8;
  ctx.strokeRect(0, 0, width, height);

  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";

  // big header
  ctx.font = "bold 72px 'R3Font'";
  ctx.fillText("R3 pre-MVP", width / 2, 180);

  // title / content line
  ctx.font = "48px 'R3Font'";
  ctx.fillText(titleForDisplay, width / 2, 280);

  // shareId
  ctx.font = "40px 'R3Font'";
  ctx.fillText(`Share ID: ${shareId}`, width / 2, 360);

  // views
  ctx.font = "40px 'R3Font'";
  ctx.fillText(`Views: ${viewsCount}`, width / 2, 420);

  // footer/domain
  ctx.fillStyle = "#666666";
  ctx.font = "36px 'R3Font'";
  ctx.fillText("r3-pre-mvp-full", width / 2, 500);

  // export PNG buffer -> Uint8Array
  const pngBuffer = canvas.toBuffer("image/png");
  const pngBytes = new Uint8Array(pngBuffer);

  // response with aggressive no-cache headers
  return new Response(pngBytes, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control":
        "no-store, no-cache, must-revalidate, max-age=0, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      "x-vercel-cache": "MISS",
    },
  });
}
