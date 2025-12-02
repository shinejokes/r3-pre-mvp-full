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
    .select(
      "title, views, hop, original_url, target_url, thumbnail_url, message_id"
    )
    .eq("ref_code", shareId)
    .maybeSingle();

  if (error) {
    return new Response(`Supabase error: ${error.message}`, { status: 500 });
  }

  if (!data) {
    return new Response("Share not found", { status: 404 });
  }

  const {
    title,
    views,
    hop,
    original_url,
    target_url,
    thumbnail_url,
    message_id,
  } = data as {
    title: string | null;
    views: number | null;
    hop: number | null;
    original_url: string | null;
    target_url: string | null;
    thumbnail_url: string | null;
    message_id?: string | null;
  };

  // 1) 원본 기준 누적 조회수 (message_id 기준)
  let viewsForDisplay = views ?? 0;

  if (message_id) {
    const { count, error: countError } = await supabase
      .from("r3_hits")
      .select("id", { count: "exact", head: true })
      .eq("message_id", message_id);

    if (!countError && typeof count === "number") {
      viewsForDisplay = count;
    }
  }

  // YouTube 썸네일 ID 추출
  function extractYouTubeId(url?: string | null): string | null {
    if (!url) return null;

    const m1 = url.match(/v=([A-Za-z0-9_-]{11})/);
    if (m1 && m1[1]) return m1[1];

    const m2 = url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
    if (m2 && m2[1]) return m2[1];

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
    } else {
      thumb = null;
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
          fontFamily: "system-ui, sans-serif",
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

          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.55))",
            }}
          />

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

        {/* 하단 R3 카운터 배지 */}
        <div
          style={{
            position: "absolute",
            right: 60,
            bottom: 60,
            padding: "28px 44px",
            borderRadius: 12,
            backgroundColor: "rgba(0,0,0,0.80)",
            border: "4px solid #ffffff",
            display: "flex",
            alignItems: "center",
            gap: 60,
            fontSize: 60,
            lineHeight: 1.1,
            fontWeight: 700,
            color: "#ffffff",
          }}
        >
          <span>R³</span>
          <span>Views {viewsForDisplay}</span>
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
