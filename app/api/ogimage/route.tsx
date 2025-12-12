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

  // 제목 (표시용으로만 살짝 자르기)
  const rawTitle = data.title || "R3 링크";
  const title =
    rawTitle.length > 80 ? rawTitle.slice(0, 77) + "…" : rawTitle;

  // description: r3_shares → 없으면 r3_messages에서 fallback
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

  const meta = getContentMeta(data.original_url);
  const typeLine = `${meta.sourceLabel} · ${meta.typeLabel}`;

  // message_id 묶음 total views
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

  // ===== 썸네일 레이아웃 =====
  const accentRed = "#fecaca"; // 옅은 붉은색

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
        {/* 1) 맨 윗줄: 영상 종류 (부제)  */}
        <div
          style={{
            fontSize: 54,
            fontWeight: 600,
            color: accentRed,
            marginBottom: 24,
          }}
        >
          {typeLine}
        </div>

        {/* 2) 제목 : 60, Bold, 옅은 노랑, 최대 2줄 */}
        <div
          style={{
            fontSize: 60,
            fontWeight: 700,
            color: "#fef08a",
            lineHeight: 1.25,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {title}
        </div>

        {/* 3) Description : 54, 최대 2줄 */}
        <div
          style={{
            marginTop: 18,
            fontSize: 54,
            lineHeight: 1.25,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            opacity: descriptionText ? 0.96 : 0,
          }}
        >
          {descriptionText || " "}
        </div>

        {/* 중간 여백 */}
        <div style={{ flexGrow: 1 }} />

        {/* 4) 맨 아랫줄: R³ THE HUMAN NETWORK · Views · Hop */}
       // 중간 여백
<div style={{ flexGrow: 1 }} />

{/* 4) 맨 아랫줄: R³ NETWORK · Views · Hop */}
<div
  style={{
    fontSize: 54,
    fontWeight: 500,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,              // ← 설명과 약간 띄우기
    whiteSpace: "nowrap",       // ← 가능하면 한 줄 유지
  }}
>
  <span style={{ letterSpacing: 2 }}>
    R³ NETWORK                   {/* ← 글자를 줄여 한 줄에 맞추기 */}
  </span>
  <span style={{ color: accentRed }}>
    Views {views} · Hop {hop}
  </span>
</div>

      </div>
    ),
    size
  );
}
