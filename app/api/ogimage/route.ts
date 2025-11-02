// app/api/ogimage/route.ts

import { NextRequest } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";
import { createCanvas } from "canvas";

// 이 라우트는 node-canvas를 쓰므로 반드시 Node.js 런타임이어야 합니다.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  //
  // 1) 쿼리에서 shareId 읽기
  //
  const { searchParams } = new URL(req.url);
  const shareId = searchParams.get("shareId");

  if (!shareId) {
    return new Response("Missing shareId", { status: 400 });
  }

  //
  // 2) Supabase 클라이언트
  //
  const supabase = supabaseServer();

  //
  // 3) r3_shares에서 title 가져오기
  //    ref_code == shareId 인 행을 찾는다.
  //
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

  //
  // 4) r3_hits에서 조회수 세기
  //    share_id == shareId 인 행의 개수를 exact count로 요청
  //
  let viewsCount = 0;
  {
    const { count, error } = await supabase
      .from("r3_hits")
      .select("*", { count: "exact", head: true })
      .eq("share_id", shareId); // <- 만약 컬럼명이 다르면 바꿔주셔야 합니다

    if (error) {
      console.error("Error counting hits:", error.message);
    }

    if (typeof count === "number") {
      viewsCount = count;
    }
  }

  //
  // 5) node-canvas로 OG 이미지 만들기
  //
  const width = 1200;
  const height = 630;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // 배경 (흰색) + 테두리(연한 회색)
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#cccccc";
  ctx.lineWidth = 8;
  ctx.strokeRect(0, 0, width, height);

  // 상단 서비스 이름
  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";
  ctx.font = "bold 72px sans-serif";
  ctx.fillText("R3 pre-MVP", width / 2, 180);

  // 제목은 너무 길면 잘라서 1줄로
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

  // 하단 도메인
  ctx.fillStyle = "#666666";
  ctx.font = "36px sans-serif";
  ctx.fillText("r3-pre-mvp-full", width / 2, 500);

  //
  // 6) PNG buffer -> ArrayBuffer 변환
  //
  const pngBuffer = canvas.toBuffer("image/png");

  // pngBuffer는 Node.js Buffer (Uint8Array 비슷하지만 Response가 싫어함)
  // 그래서 표준 ArrayBuffer로 잘라서 넘긴다.
  const pngArrayBuffer = pngBuffer.buffer.slice(
    pngBuffer.byteOffset,
    pngBuffer.byteOffset + pngBuffer.byteLength
  );

  //
  // 7) 응답
  //
  return new Response(pngArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}
