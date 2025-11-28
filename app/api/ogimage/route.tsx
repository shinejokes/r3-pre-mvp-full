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

  // Supabase에서 공유 정보 가져오기
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("r3_shares")
    .select("title, views, hop, original_url, target_url, thumbnail_url")
    .eq("ref_code", shareId)
    .maybeSingle();

  if (error) {
    return new Response(`Supabase error: ${error.message}`, { status: 500 });
  }
  if (!data) {
    return new Response("Share not found", { status: 404 });
  }

  const { title, views, hop, original_url, target_url, thumbnail_url } = data;

  // 1) 우선 DB에 직접 저장된 thumbnail_url 이 있으면 그대로 사용
  // 2) 없으면 target_url/original_url 이 YouTube이면 VIDEO_ID 추출해서 썸네일 URL 생성
  function extractYouTubeId(url?: string | null): string | null {
    if (!url) return null;
    // https://www.youtube.com/watch?v=XXXXXXXXXXX
    const m1 = url.match(/v=([A-Za-z0-9_-]{11})/);
    if (m1 && m1[1]) return m1[1];

    // https://youtu.be/XXXXXXXXXXX
    const m2 = url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
    if (m2 && m2[1]) return m2[1];

    return null;
  }

  let thumb: string | null = null;

  if (thumbnail_url) {
    // DB에 썸네일이 직접 지정된 경우
    thumb = thumbnail_url;
  } else {
    const urlForId = target_url || original_url || null;
    const videoId = extractYouTubeId(urlForId);
    if (videoId) {
      thumb = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    } else {
      thumb = null; // 유튜브가 아니면 기본 그라디언트 배경 사용
    }
  }

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
          fontFamily: "Pretendard, system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* 1) 원본 썸네일 또는 대체 박스 (오버레이 + 텍스트 포함) */}
        <div
          style={{
            width: "1060px",
            height: "420px",
            position: "relative",
            borderRadius: "24px",
            overflow: "hidden",
            backgroundColor: "#020617",
            boxShadow: "0 16px 48px rgba(0, 0, 0, 0.5)",
            display: "flex", // @vercel/og 에서 자식 여러 개일 때 필요
          }}
        >
          {/* 1-1) 원본 썸네일 */}
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
            /* 1-2) 썸네일이 없을 때 대체 배경 */
            <div
              style={{
                width: "100%",
                height: "100%",
                background:
                  "radial-gradient(circle at center, #1f2a3f 0%, #050914 55%, #020308 100%)",
              }}
            />
          )}

          {/* 1-3) 어두운 오버레이 */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.55))",
            }}
          />

          {/* 1-4) 중앙 텍스트 */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: "40px",
              letterSpacing: "8px",
              color: "rgba(226,232,240,0.92)",
              whiteSpace: "nowrap",
              fontWeight: 700,
            }}
          >
            R3 HAND-FORWARDED LINK
          </div>
        </div>

             {/* 2) 하단 오버레이 박스 (폰트 크게, 오른쪽 아래 + 흰 테두리) */}
        <div
          style={{
            position: "absolute",
            right: 60,              // ✅ 왼쪽 → 오른쪽 정렬
            bottom: 60,
            padding: "28px 44px",
            borderRadius: 999,
            backgroundColor: "rgba(0,0,0,0.80)",
            border: "4px solid #ffffff", // ✅ 흰 테두리 추가
            display: "flex",
            alignItems: "center",
            gap: 60,
            fontSize: 60,
            lineHeight: 1.1,
            fontWeight: 700,
            color: "#ffffff",
          }}
        >
          <span>R3</span>
          <span>Views {views}</span>
          <span>Hop {hop}</span>
        </div>

      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
