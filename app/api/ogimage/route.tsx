import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shareId = searchParams.get("shareId");

  if (!shareId) {
    return new Response("Invalid shareId", { status: 400 });
  }

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("r3_shares")
    .select("original_url, target_url, thumbnail_url, message_id, hop, views")
    .eq("ref_code", shareId)
    .maybeSingle();

  if (error) {
    return new Response(`Supabase error: ${error.message}`, { status: 500 });
  }

  if (!data) {
    return new Response("Share not found", { status: 404 });
  }

  const {
    original_url,
    target_url,
    thumbnail_url,
    message_id,
  } = data as {
    original_url: string | null;
    target_url: string | null;
    thumbnail_url: string | null;
    message_id?: string | null;
    hop?: number | null;
    views?: number | null;
  };

  // ----------------------------
  // 1) 원본 썸네일 URL 결정
  // ----------------------------

  // YouTube 썸네일 ID 추출
  function extractYouTubeId(url?: string | null): string | null {
    if (!url) return null;

    const m1 = url.match(/v=([A-Za-z0-9_-]{11})/);
    if (m1?.[1]) return m1[1];

    const m2 = url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
    if (m2?.[1]) return m2[1];

    return null;
  }

  let thumb: string | null = null;

  if (thumbnail_url) {
    thumb = thumbnail_url;
  } else {
    const urlForId = target_url || original_url || null;
    const videoId = extractYouTubeId(urlForId);
    if (videoId) {
      thumb = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    }
  }

  // ----------------------------
  // 2) "전체 전달 수" (정적 신호 세트 기준)
  //    - message_id 기준 r3_shares 개수
  //    - message_id 없으면: 최소 1로 처리
  // ----------------------------
  let forwardCountForSignal = 1;

function getR3TextColor(forwardCount: number) {
  if (forwardCount >= 100) return "#16a34a"; // green
  if (forwardCount >= 10) return "#2563eb";  // blue
  return "#111827";                           // dark gray (초기에도 잘 보임)
}

  if (message_id) {
    const { count, error: countError } = await supabase
      .from("r3_shares")
      .select("id", { count: "exact", head: true })
      .eq("message_id", message_id);

    if (!countError && typeof count === "number") {
      forwardCountForSignal = Math.max(1, count);
    }
  }

  // ----------------------------
  // 3) R³ 색상(3단계)
  //    0–9: black, 10–99: blue, 100+: green
  // ----------------------------
  function getR3ColorByForwards(n: number) {
    if (n >= 100) return "#22c55e"; // green
    if (n >= 10) return "#3b82f6";  // blue
    return "#0b0f19";               // near-black (검정이지만 배경과 구분되게 살짝 톤)
  }

  const r3Color = getR3ColorByForwards(forwardCountForSignal);

  // ----------------------------
  // 4) OG 이미지 렌더
  //    - 원본 썸네일 + R³ 배지 단독
  //    - 문구/숫자/Views/Hop 모두 제거
  // ----------------------------
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0b172a",
          fontFamily: 'system-ui, -apple-system, "Noto Sans KR", sans-serif',
          position: "relative",
        }}
      >
        {/* 상단 썸네일 영역 */}
        <div
          style={{
            width: "1060px",
            height: "420px",
            position: "relative",
            borderRadius: "24px",
            overflow: "hidden",
            backgroundColor: "#020617",
            boxShadow: "0 16px 48px rgba(0, 0, 0, 0.5)",
            display: "flex",
          }}
        >
          {thumb ? (
            <img
              src={thumb}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background:
                  "radial-gradient(circle at center, #1f2a3f 0%, #050914 55%, #020308 100%)",
              }}
            />
          )}

          {/* 원본 썸네일 위에 아주 얕은 어둠막(선택) — 과하지 않게 */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.18), rgba(0,0,0,0.30))",
            }}
          />
        </div>

        {/* 하단 우측 R³ 배지 (단독, 색상 신호) */}
<div
  style={{
    position: "absolute",
    right: 48,
    bottom: 48,
    width: 96,
    height: 96,
    borderRadius: "50%",
    backgroundColor: "rgba(255,255,255,0.35)", // 옅은 반투명
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 56,
    fontWeight: 800,
    color: getR3TextColor(forwardCountForSignal),
    backdropFilter: "blur(2px)", // 지원 안 되면 무시됨
  }}
>
  R³
</div>

      </div>
    ),
    { width: 1200, height: 630 }
  );
}
