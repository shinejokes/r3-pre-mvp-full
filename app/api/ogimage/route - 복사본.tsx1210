// app/api/ogimage/route.ts
import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { supabaseServer } from "../../../lib/supabaseServer";

export const runtime = "edge";

const size = {
  width: 1200,
  height: 630,
};

// original_url을 보고 콘텐츠 타입/출처 자동 판별
type ContentMeta = {
  typeLabel: string;   // 동영상, 글, 이미지, 문서, 링크 등
  sourceLabel: string; // YouTube, Naver Blog, Web 등
};

function getContentMeta(originalUrl?: string | null): ContentMeta {
  let typeLabel = "링크";
  let sourceLabel = "Web";

  if (!originalUrl) return { typeLabel, sourceLabel };

  try {
    const url = new URL(originalUrl);
    const host = url.hostname.toLowerCase();
    const path = url.pathname.toLowerCase();

    // 유튜브
    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      return { typeLabel: "동영상", sourceLabel: "YouTube" };
    }

    // 페이스북
    if (host.includes("facebook.com")) {
      return { typeLabel: "동영상", sourceLabel: "Facebook" };
    }

    // 인스타그램
    if (host.includes("instagram.com")) {
      return { typeLabel: "동영상/사진", sourceLabel: "Instagram" };
    }

    // 네이버 블로그
    if (host.includes("blog.naver.com")) {
      return { typeLabel: "글", sourceLabel: "Naver Blog" };
    }

    // 구글 문서
    if (host.includes("docs.google.com")) {
      return { typeLabel: "문서", sourceLabel: "Google Docs" };
    }

    // 이미지 파일
    if (/\.(png|jpg|jpeg|gif|webp|avif)$/.test(path)) {
      return { typeLabel: "이미지", sourceLabel: "Web" };
    }

    // 동영상 파일
    if (/\.(mp4|mov|avi|mkv|webm)$/.test(path)) {
      return { typeLabel: "동영상", sourceLabel: "Web" };
    }

    // 기본: 일반 웹페이지
    return { typeLabel: "링크", sourceLabel: url.hostname };
  } catch {
    return { typeLabel, sourceLabel };
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shareId = searchParams.get("shareId");

  // shareId가 없을 때의 기본 썸네일
  if (!shareId) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            background:
              "radial-gradient(circle at 0% 0%, #0f172a, #020617 55%, #020617)",
            color: "#e5e7eb",
            fontFamily:
              'system-ui, -apple-system, BlinkMacSystemFont, "Noto Sans KR", sans-serif',
          }}
        >
          <div
            style={{
              fontSize: 40,
              letterSpacing: 6,
              textTransform: "uppercase",
              opacity: 0.9,
            }}
          >
            R3 HAND-FORWARDED LINK
          </div>
        </div>
      ),
      size
    );
  }

  const supabase = supabaseServer();

  // r3_shares에서 정보 읽기 (description 포함)
  const { data, error } = await supabase
    .from("r3_shares")
    .select(
      "title, views, hop, original_url, description, message_id"
    )
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

  // 제목 (너무 길면 잘라주기)
  const rawTitle = data.title || "R3 링크";
  const title =
    rawTitle.length > 40 ? rawTitle.slice(0, 37) + "…" : rawTitle;

  // 설명 (선택 사항)
  const descriptionText =
    (data.description && data.description.trim()) || null;

  // 출처/타입 자동 추출
  const meta = getContentMeta(data.original_url);
  const typeLine = `${meta.sourceLabel} · ${meta.typeLabel}`;

  // 조회수: 동일 message_id 묶음의 합계
  let totalViews = data.views ?? 0;
  if (data.message_id) {
    const { data: siblings, error: sumError } = await supabase
      .from("r3_shares")
      .select("views")
      .eq("message_id", data.message_id);

    if (!sumError && siblings) {
      totalViews = siblings.reduce(
        (sum, row) => sum + (row.views ?? 0),
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
            fontSize: 30,
            letterSpacing: 6,
            textTransform: "uppercase",
            opacity: 0.85,
            marginBottom: 32,
          }}
        >
          R3 HAND-FORWARDED LINK
        </div>

        {/* 가운데 내용 영역 */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            maxWidth: 900,
          }}
        >
          {/* 제목 */}
          <div
            style={{
              fontSize: 60,
              fontWeight: 700,
              lineHeight: 1.15,
              whiteSpace: "pre-wrap",
            }}
          >
            {title}
          </div>

          {/* 설명 (있으면 표시, 없으면 같은 높이만큼 빈 공간 유지) */}
          <div
            style={{
              marginTop: 24,
              fontSize: 30,
              lineHeight: 1.4,
              minHeight: 40, // 설명이 없어도 레이아웃 유지
              opacity: descriptionText ? 0.96 : 0,
            }}
          >
            {descriptionText || " "}
          </div>

          {/* 출처/타입 라벨 */}
          <div
            style={{
              marginTop: 16,
              fontSize: 26,
              color: "#9ca3af",
            }}
          >
            {typeLine}
          </div>
        </div>

        {/* 하단 고정 영역: 왼쪽 안내 문구 + 오른쪽 R³ 배지 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 40,
          }}
        >
          {/* 항상 같은 위치의 파란 문구 */}
          <div
            style={{
              flex: 1,
              fontSize: 26,
              color: "#60a5fa",
            }}
          >
            여기를 눌러 링크를 확인하세요.
          </div>

          {/* R³ Views / Hop 배지 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 28,
              padding: "20px 52px",
              borderRadius: 9999,
              border: "3px solid #e5e7eb",
              fontSize: 44,
              fontWeight: 500,
              background:
                "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(15,23,42,0.4))",
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
