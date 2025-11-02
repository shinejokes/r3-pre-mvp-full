// app/api/ogimage/route.ts

import { NextRequest } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

// node-canvas (서버 측에서 이미지를 직접 그리는 라이브러리)
import { createCanvas } from "canvas";

// Vercel Edge Runtime에서는 node-canvas를 못 쓰므로,
// 이 라우트는 Node.js 런타임에서 돌도록 강제로 지정합니다.
export const runtime = "nodejs";
// 캐시 없이 항상 최신 조회수를 그리게 하고 싶으니 동적 처리
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // 1) URL에서 shareId 추출
  const { searchParams } = new URL(req.url);
  const shareId = searchParams.get("shareId");

  if (!shareId) {
    return new Response("Missing shareId", { status: 400 });
  }

  // 2) Supabase 클라이언트 준비
  const supabase = supabaseServer();

  // 3) Supabase에서 제목(title) 가져오기
  // r3_shares:
  //   ref_code  (우리가 공유 아이디로 쓰는 값)
  //   title     (사람이 쓴 메시지 제목 / 설명)
  //
  // ref_code == shareId 인 행 하나를 찾는다.
  let titleText = "";
  {
    const { data, error } = await supabase
      .from("r3_shares")
      .select("title")
      .eq("ref_code", shareId)
      .maybeSingle(); // 없으면 null, 있으면 1개

    if (error) {
      console.error("Error fetching title:", error.message);
    }

    if (data && data.title) {
      titleText = data.title;
    } else {
      // 못 찾았을 경우에도 계속 이미지는 만들어 줍니다.
      titleText = "(no title)";
    }
  }

  // 4) Supabase에서 조회수(hits) 가져오기
  // r3_hits:
  //   share_id  (또는 비슷한 이름. 우리는 shareId와 매칭된다고 가정)
  //   created_at ...
  //
  // count 전용 select 로 개수를 얻는다.
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

  // 5) node-canvas로 OG 썸네일 이미지 그리기
  //
  // 보편적인 OG 사이즈: 1200 x 630
  // (카카오톡 등 미리보기에도 잘 맞는 가로형 비율)
  const width = 1200;
  const height = 630;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // ----- 배경 -----
  ctx.fillStyle = "#ffffff"; // 흰 배경
  ctx.fillRect(0, 0, width, height);

  // 테두리(연한 회색 박스 느낌)
  ctx.strokeStyle = "#cccccc";
  ctx.lineWidth = 8;
  ctx.strokeRect(0, 0, width, height);

  // ----- 텍스트 스타일 -----
  // 상단: 서비스 이름
  ctx.fillStyle = "#000000";
  ctx.font = "bold 72px sans-serif";
  ctx.textAlign = "center";

  ctx.fillText("R3 pre-MVP", width / 2, 180);

  // 가운데: 실제 제목 (여러 글자일 수 있으므로 줄바꿈 처리 간단 버전)
  // 너무 길면 잘라서 두 줄까지만 표시
  const maxLen = 40; // 너무 길 경우 잘라주자 (간단처리)
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

  // 하단: 도메인/서버명
  ctx.fillStyle = "#666666";
  ctx.font = "36px sans-serif";
  ctx.fillText("r3-pre-mvp-full", width / 2, 500);

  // 6) PNG 바이너리 추출
  const pngBuffer = canvas.toBuffer("image/png");

  // 7) 응답
  return new Response(pngBuffer, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      // 캐시를 막아서 항상 최신 조회수 이미지가 뜨게
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}
