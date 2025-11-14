/* app/api/ogimage/route.tsx */

import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shareId = searchParams.get("shareId") || "NO_ID";

  // ====== 배경 이미지(유튜브 썸네일 또는 fallback) ======
  let thumbnailUrl = `https://img.youtube.com/vi/${extractYouTubeId(
    shareId
  )}/hqdefault.jpg`;

  // ====== 조회수 불러오기 ======
  const views = await fetchHitsCount(shareId);

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          backgroundColor: "#000",
        }}
      >
        {/* ===== 배경 이미지 ===== */}
        <img
          src={thumbnailUrl}
          alt="bg"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />

        {/* ===== 왼쪽 상단 Hits 박스 ===== */}
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 40,
            backgroundColor: "white",
            color: "black",
            padding: "14px 28px",
            borderRadius: 16,

            display: "flex",
            alignItems: "center",
            gap: 12,

            boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
          }}
        >
          <span
            style={{
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: "0.05em",
            }}
          >
            R3
          </span>

          <span
            style={{
              fontSize: 28,
              fontWeight: 600,
            }}
          >
            Hits {views.toLocaleString("en-US")}
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

/* ====== Helper: YouTube ID 추출 ====== */
function extractYouTubeId(url: string) {
  // ID를 URL로 사용 중이면 fallback
  if (!url.includes("http")) return url;

  // youtu.be 단축 주소
  if (url.includes("youtu.be/")) {
    return url.split("youtu.be/")[1].split("?")[0];
  }

  // youtube watch?v=
  if (url.includes("watch?v=")) {
    return url.split("watch?v=")[1].split("&")[0];
  }

  // 모르면 ID 대신 그대로 사용
  return url;
}

/* ====== Helper: 조회수 가져오기 ====== */
async function fetchHitsCount(shareId: string) {
  try {
    const resp = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/r3_hits?share_id=eq.${shareId}&select=count`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        cache: "no-store",
      }
    );

    if (!resp.ok) return 0;
    const json = await resp.json();
    return json?.[0]?.count || 0;
  } catch (e) {
    return 0;
  }
}
