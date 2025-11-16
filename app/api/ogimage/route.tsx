// app/api/ogimage/route.ts
import React from "react";
import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { supabaseServer } from "../../../lib/supabaseServer";

export const runtime = "edge";

// YouTube 링크에서 영상 ID 추출
function extractYouTubeId(urlStr: string): string | null {
  try {
    const url = new URL(urlStr);

    if (url.hostname.includes("youtu.be")) {
      // https://youtu.be/VIDEO_ID
      return url.pathname.replace("/", "").split("/")[0] || null;
    }

    if (url.hostname.includes("youtube.com")) {
      // https://www.youtube.com/watch?v=VIDEO_ID
      const v = url.searchParams.get("v");
      if (v) return v;

      // https://www.youtube.com/shorts/VIDEO_ID
      if (url.pathname.startsWith("/shorts/")) {
        return url.pathname.split("/")[2] || null;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

// YouTube 썸네일 URL 만들기
function getYouTubeThumbnail(urlStr: string): string | null {
  const id = extractYouTubeId(urlStr);
  if (!id) return null;
  // 안전하게 hqdefault 사용
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

// 외부 페이지의 og:image 추출 (다양한 사이트 대응)
async function fetchOgImage(urlStr: string): Promise<string | null> {
  try {
    const res = await fetch(urlStr, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      },
    });

    if (!res.ok) return null;
    const html = await res.text();

    // og:image
    const ogMatch = html.match(
      /<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i
    );
    if (ogMatch?.[1]) return ogMatch[1];

    // twitter:image
    const twMatch = html.match(
      /<meta[^>]+name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/i
    );
    if (twMatch?.[1]) return twMatch[1];

    return null;
  } catch {
    return null;
  }
}

// target/original_url에서 최종 썸네일 URL 결정
async function resolveThumbnailUrl(targetUrl: string): Promise<string | null> {
  if (!targetUrl) return null;

  // 1) YouTube면 자체 규칙으로 바로 썸네일 생성
  const youtubeThumb = getYouTubeThumbnail(targetUrl);
  if (youtubeThumb) return youtubeThumb;

  // 2) 그 외 사이트는 og:image 크롤링 시도
  const ogImage = await fetchOgImage(targetUrl);
  if (ogImage) return ogImage;

  // 3) 실패하면 null (우리 디자인 배경만 사용)
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shareId = searchParams.get("shareId");

  if (!shareId) {
    return new Response("Missing shareId", { status: 400 });
  }

  const supabase = supabaseServer();

  // 1) 공유 레코드 가져오기 (hop 포함)
  const { data: share, error: shareError } = await supabase
    .from("r3_shares")
    .select("id, title, original_url, target_url, hop")
    .eq("ref_code", shareId)
    .maybeSingle();

  if (shareError || !share) {
    console.error("share fetch error:", shareError);
    return new Response("Share not found", { status: 404 });
  }

  // 2) 조회수(hits) 개수 세기
  const { count: hitsCount, error: hitsError } = await supabase
    .from("r3_hits")
    .select("*", { count: "exact", head: true })
    .eq("share_id", share.id);

  if (hitsError) {
    console.error("hits fetch error:", hitsError);
  }

  const views = hitsCount ?? 0;
  const hop = share.hop ?? 1;

  // 원본/타겟 URL
  const targetUrl = share.target_url || share.original_url || "";
  let hostname = "";
  try {
    if (targetUrl) {
      hostname = new URL(targetUrl).hostname.replace(/^www\./, "");
    }
  } catch {
    // ignore
  }

  // 제목: 없으면 아예 표시하지 않음
  const title = (share.title || "").trim();

  // 3) 썸네일 URL 결정 (YouTube + 다양한 외부 사이트 대응)
  const thumbnailUrl = await resolveThumbnailUrl(targetUrl);

  // 모바일 카카오톡에서도 잘 보이도록 크게 조정
  const badgeStyle: React.CSSProperties = {
    padding: "12px 24px",
    borderRadius: 9999,
    fontSize: 34,
    fontWeight: 700,
    border: "3px solid rgba(248, 250, 252, 0.9)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.85)",
  };

  const r3BadgeStyle: React.CSSProperties = {
    padding: "12px 28px",
    borderRadius: 9999,
    fontSize: 36,
    fontWeight: 800,
    backgroundColor: "rgba(15, 23, 42, 1.0)", // 불투명 진한 남색
    color: "#ffffff",
    border: "3px solid rgba(248, 250, 252, 0.95)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          position: "relative",
          display: "flex",
          alignItems: "stretch",
          justifyContent: "center",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          color: "#f9fafb",
          backgroundColor: "#020617",
        }}
      >
        {/* 원본 썸네일 전체 배경 */}
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt="Original thumbnail"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          // 썸네일 실패 시 기본 배경
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at top left, #0f172a, #020617 55%, #020617)",
            }}
          />
        )}

        {/* 어두운 오버레이 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(15,23,42,0.9), rgba(15,23,42,0.2), rgba(15,23,42,0.95))",
          }}
        />

        {/* 내용 레이아웃 */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            height: "100%",
            padding: "40px 60px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* 상단: 도메인만 표시 */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 32,
              fontWeight: 700,
            }}
          >
            <div />
            {hostname && (
              <span
                style={{
                  fontSize: 24,
                  color: "#cbd5f5",
                  backgroundColor: "rgba(15,23,42,0.6)",
                  padding: "6px 14px",
                  borderRadius: 9999,
                }}
              >
                {hostname}
              </span>
            )}
          </div>

          {/* 중앙 제목 (title이 있을 때만 표시) */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              maxWidth: "1000px",
            }}
          >
            {title && (
              <div
                style={{
                  fontSize: 50,
                  fontWeight: 800,
                  lineHeight: 1.2,
                  whiteSpace: "pre-wrap",
                  textShadow: "0 4px 18px rgba(15,23,42,0.95)",
                }}
              >
                {title}
              </div>
            )}
          </div>

          {/* 하단 뱃지 (R3 + 조회수 + HOP) */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 20,
              alignItems: "center",
            }}
          >
            {/* R3 박스 */}
            <div style={r3BadgeStyle}>R3</div>

            {/* 조회수 배지 */}
            <div style={badgeStyle}>
              <span style={{ marginRight: 10 }}>Views</span>
              <span>{views}</span>
            </div>

            {/* HOP 배지 */}
            <div style={badgeStyle}>
              <span style={{ marginRight: 10 }}>HOP</span>
              <span>{hop}</span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
