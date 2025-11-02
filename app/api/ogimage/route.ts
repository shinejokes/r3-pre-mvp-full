// app/api/ogimage/route.ts

import { NextRequest } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";
import { createCanvas } from "canvas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // 1) URL 쿼리에서 shareId 추출
  const { searchParams } = new URL(req.url);
  const shareId = searchParams.get("shareId");

  if (!shareId) {
    return new Response("Missing shareId", { status: 400 });
  }

  // 2) Supabase 클라이언트
  const supabase = supabaseServer();

  // 3) r3_shares에서 title 가져오기 (ref_code == shareId)
  let titleText = "(no title)";
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
      titleText = data.title;
    }
  }

  // 4) r3_hits에서 조회수 세기 (share_id == shareId)
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

  // 5) node-canvas로 이미지 생성
  const width = 1200;
  const height = 630;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // 배경 (흰색) + 연회색 테두리
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#cccccc";
  ctx.lineWidth = 8;
  ctx.strokeRect(0, 0, width, height);

  // 텍스트 기본 스타일
  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";

  // 상단 서비스 이름
  ctx.font = "bold 72px sans-serif";
  ctx.fillText("R3 pre-MVP", width / 2, 180);

  // 너무 긴 제목은 잘라서 한 줄로
  const maxLen = 40;
  const safeTitle =
    titleText.length > maxLen
      ? titleText.slice(0, maxLen - 3) + "..."
      : titleText;

  ctx.font = "48px sans-serif";
  ctx.fillText(safeTitle, width / 2, 280);

  // shareId
  ctx.font = "40px sans-serif";
  ctx.fillText(`shareId: ${shareId}`, width / 2, 360);

  // 조회수
  ctx.font = "40px sans-serif";
  ctx.fillText(`Views: ${viewsCount}`, width / 2, 420);

  // 하단 도메인 표시 (회색)
  ctx.fillStyle = "#666666";
  ctx.font = "36px sans-serif";
  ctx.fillText("r3-pre-mvp-full", width / 2, 500);

  // 6) PNG를 바이트 배열로 추출
  //    canvas.toBuffer("image/png") -> Node Buffer
  const pngBuffer = canvas.toBuffer("image/png");

  // Response는 Uint8Array도 받을 수 있으므로 변환
  const pngBytes = new Uint8Array(pngBuffer);

  // 7) HTTP 응답
  return new Response(pngBytes, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}
