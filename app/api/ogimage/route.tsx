// app/api/ogimage/route.tsx
import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { supabaseServer } from "../../../lib/supabaseServer";

export const runtime = "nodejs";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

// 유튜브 URL에서 video ID 뽑아내기
function extractYoutubeId(rawUrl: string | null): string | null {
  if (!rawUrl) return null;
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace(/^www\./, "");

    // youtu.be/VIDEO_ID
    if (host === "youtu.be") {
      const id = url.pathname.replace("/", "").split(/[?/]/)[0];
      return id || null;
    }

    if (host.endsWith("youtube.com")) {
      // /watch?v=VIDEO_ID
      const v = url.searchParams.get("v");
      if (v) return v;

      // /shorts/VIDEO_ID
      if (url.pathname.startsWith("/shorts/")) {
        const id = url.pathname.replace("/shorts/", "").split(/[?/]/)[0];
        return id || null;
      }

      // /embed/VIDEO_ID
      if (url.pathname.startsWith("/embed/")) {
        const id = url.pathname.replace("/embed/", "").split(/[?/]/)[0];
        return id || null;
      }
    }
  } catch {
    // 잘못된 URL은 무시
  }
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shareId = searchParams.get("shareId") || "NO_PARAM";

  const supabase = supabaseServer();

  // 1) ref_code에 해당하는 share 정보 가져오기
  const { data: share, error: shareError } = await supabase
    .from("r3_shares")
    .select("id, title, original_url, target_url")
    .eq("ref_code", shareId)
    .maybeSingle();

  if (shareError) {
    console.error("ogimage shareError:", shareError);
  }

  // 2) 조회수 세기
  let views = 0;
  if (share?.id) {
    const { count, error: hitsError } = await supabase
      .from("r3_hits")
      .select("*", { count: "exact", head: true })
      .eq("share_id", share.id);

    if (hitsError) {
      console.error("ogimage hitsError:", hitsError);
    } else if (typeof count === "number") {
      views = count;
    }
  }

  const baseTitle = `R3 v12 • ${shareId}`;
  const urlForDisplay =
    share?.target_url || share?.original_url || "";

  // 3) 유튜브 썸네일 URL 만들기
  const videoId = extractYoutubeId(urlForDisplay);
  const youtubeThumbUrl = videoId
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: size.width,
          height: size.height,
          position: "relative",
          display: "flex",
          alignItems: "stretch",
          justifyContent: "center",
          backgroundColor: "#000",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {/* 배경: 유튜브 썸네일 (없으면 검정 배경) */}
        {youtubeThumbUrl && (
          <img
            src={youtubeThumbUrl}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "brightness(0.7)",
            }}
          />
        )}

        {/* 오버레이 전체 컨테이너 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 48,
            color: "#f9fafb",
          }}
        >



          {/* 하단: 심플한 R3 Hits N 배지 */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div
              style={{
                backgroundColor: "rgba(15,23,42,0.9)",
                borderRadius: 999,
                padding: "14px 36px",
                display: "flex",
                alignItems: "baseline",
                gap: 12,
              }}
            >
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
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
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
