// app/api/ogimage/route.ts
import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { supabaseServer } from "../../../lib/supabaseServer";

export const runtime = "edge";

const size = { width: 1200, height: 630 };

type ContentMeta = {
  typeLabel: string;
  sourceLabel: string;
};

function getContentMeta(originalUrl?: string | null): ContentMeta {
  let typeLabel = "링크";
  let sourceLabel = "Web";

  if (!originalUrl) return { typeLabel, sourceLabel };

  try {
    const url = new URL(originalUrl);
    const host = url.hostname.toLowerCase();
    const path = url.pathname.toLowerCase();

    if (host.includes("youtube.com") || host.includes("youtu.be"))
      return { typeLabel: "동영상", sourceLabel: "YouTube" };

    if (host.includes("facebook.com"))
      return { typeLabel: "동영상", sourceLabel: "Facebook" };

    if (host.includes("instagram.com"))
      return { typeLabel: "동영상/사진", sourceLabel: "Instagram" };

    if (host.includes("blog.naver.com"))
      return { typeLabel: "글", sourceLabel: "Naver Blog" };

    if (host.includes("docs.google.com"))
      return { typeLabel: "문서", sourceLabel: "Google Docs" };

    if (/\.(png|jpg|jpeg|gif|webp|avif)$/.test(path))
      return { typeLabel: "이미지", sourceLabel: "Web" };

    if (/\.(mp4|mov|avi|mkv|webm)$/.test(path))
      return { typeLabel: "동영상", sourceLabel: "Web" };

    return { typeLabel: "링크", sourceLabel: url.hostname };
  } catch {
    return { typeLabel, sourceLabel };
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shareId = searchParams.get("shareId");

  // shareId 없을 때 기본 썸네일
  if (!shareId) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background:
              "radial-gradient(circle at 0% 0%, #0f172a, #020617 55%, #020617)",
            color: "#e5e7eb",
            fontFamily:
              'system-ui, -apple-system, BlinkMacSystemFont, "Noto Sans KR", sans-serif',
          }}
        >
          <div style={{ fontSize: 48, letterSpacing: 4 }}>
            R³ · THE HUMAN NETWORK
          </div>
        </div>
      ),
      size
    );
  }

  const supabase = supabaseServer();

  // r3_shares에서 정보 읽기 (message_id 포함)
  const { data, error } = await supabase
    .from("r3_shares")
    .select("title, views, hop, original_url, description, message_id")
    .eq("ref_code", shareId)
    .maybeSingle();

  if (error || !data) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background:
              "radial-gradient(circle at 0% 0%, #0f172a, #020617 55%, #020617)",
            color: "#e5e7eb",
            fontFamily:
              'system-ui, -apple-system, BlinkMacSystemFont, "Noto Sans KR", sans-serif',
          }}
        >
          링크 정보를 찾을 수 없습니다.
        </div>
      ),
      size
    );
  }

  // 제목 (너무 길면 자르기)
  const rawTitle = data.title || "R3 링크";
  const title =
    rawTitle.length > 40 ? rawTitle.slice(0, 37) + "…" : rawTitle;

  // 🔥 description: r3_shares → 없으면 r3_messages에서 fallback
  let descriptionText =
    (data.description && data.description.trim()) || null;

  if (!descriptionText && data.message_id) {
    const { data: msg, error: msgError } = await supabase
      .from("r3_messages")
      .select("description")
      .eq("id", data.message_id)
      .maybeSingle<{ description: string | null }>();

    if (!msgError && msg?.description) {
      const trimmed = msg.description.trim();
      if (trimmed) descriptionText = trimmed;
    }
  }

  // 출처/타입 자동 추출
  const meta = getContentMeta(data.original_url);
  const typeLine = `${meta.sourceLabel} · ${meta.typeLabel}`;

  // 동일 message_id 묶음의 total views
  let totalViews = data.views ?? 0;
  if (data.message_id) {
    const { data: siblings } = await supabase
      .from("r3_shares")
      .select("views")
      .eq("message_id", data.message_id);

    if (siblings) {
      totalViews = siblings.reduce(
        (sum, r) => sum + (r.views ?? 0),
        0
      );
    }
  }

  const views = totalViews;
  const hop = data.hop ?? 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "64px 80px",
          background:
            "radial-gradient(circle at 0% 0%, #0f172a, #020617 55%, #020617)",
          color: "#e5e7eb",
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Noto Sans KR", sans-serif',
        }}
      >
        {/* 상단 라벨 */}
        <div
          style={{
            fontSize: 48,
            letterSpacing: 4,
            opacity: 0.85,
            marginBottom: 32,
          }}
        >
          R³ · THE HUMAN NETWORK
        </div>

        {/* 제목 */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.1,
            whiteSpace: "pre-wrap",
          }}
        >
          {title}
        </div>

        {/* Description - 최대 2줄, fallback 적용 결과 표시 */}
        <div
          style={{
            marginTop: 28,
            fontSize: 44,
            lineHeight: 1.3,
            maxHeight: 120,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            opacity: descriptionText ? 0.96 : 0,
          }}
        >
          {descriptionText || " "}
        </div>

        {/* 출처 라벨 */}
        <div
          style={{
            marginTop: 24,
            fontSize: 44,
            color: "#9ca3af",
          }}
        >
          {typeLine}
        </div>

        {/* 하단부 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 40,
          }}
        >
          <div style={{ flex: 1, fontSize: 38, color: "#60a5fa" }}>
            여기를 눌러 링크를 확인하세요.
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 32,
              padding: "24px 56px",
              borderRadius: 9999,
              border: "3px solid #e5e7eb",
              fontSize: 56,
              fontWeight: 500,
              background:
                "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(15,23,42,0.5))",
            }}
          >
            <span style={{ fontWeight: 700 }}>R³</span>
            <span>Views {views}</span>
            <span>Hop {hop}</span>
          </div>
        </div>
      </div>
    ),
    size
  );
}
