// app/api/ogimage/route.ts
import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { supabaseServer } from "../../../lib/supabaseServer";

export const runtime = "edge";

const size = {
  width: 1200,
  height: 630,
};

function getAutoDescription(originalUrl?: string | null): string {
  if (!originalUrl) {
    return "여기를 눌러 링크를 확인하세요.";
  }

  try {
    const url = new URL(originalUrl);
    const host = url.hostname.toLowerCase();
    const pathname = url.pathname.toLowerCase();

    // 1) 이미지 파일 확장자
    if (/\.(png|jpg|jpeg|gif|webp|avif)$/.test(pathname)) {
      return "이미지 링크입니다.";
    }

    // 2) 동영상 파일 확장자
    if (/\.(mp4|mov|avi|mkv|webm)$/.test(pathname)) {
      return "동영상 링크입니다.";
    }

    // 3) 유튜브 / 비메오 등 동영상 플랫폼
    if (
      host.includes("youtube.com") ||
      host.includes("youtu.be") ||
      host.includes("vimeo.com")
    ) {
      return "동영상 링크입니다.";
    }

    // 4) Google Docs 문서
    if (host.includes("docs.google.com")) {
      return "문서 링크입니다.";
    }

    // 5) 그 밖의 일반 웹페이지
    return "여기를 눌러 링크를 확인하세요.";
  } catch (e) {
    // URL 파싱 실패 시
    return "여기를 눌러 링크를 확인하세요.";
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shareId = searchParams.get("shareId");

  // shareId 없을 때의 기본 썸네일
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
              'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
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

 
// Supabase에서 해당 share 정보 가져오기
const supabase = supabaseServer();

const { data, error } = await supabase
  .from("r3_shares")
  .select("title, views, hop")
  .eq("ref_code", shareId)
  .maybeSingle();


  const title = (data?.title ?? "R3 링크").slice(0, 50); // 너무 길면 자르기
  const description = "여기를 눌러 링크를 확인하세요.";
  const views = data?.views ?? 0;
  const hop = data?.hop ?? 0;

return new ImageResponse(
  (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "60px 80px",
        background:
          "radial-gradient(circle at 0% 0%, #0f172a, #020617 55%, #020617)",
        color: "#e5e7eb",
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >

      {/* 최상단 라벨 */}
      <div
        style={{
          fontSize: 32,
          letterSpacing: 6,
          textTransform: "uppercase",
          opacity: 0.85,
        }}
      >
        R3 HAND-FORWARDED LINK
      </div>

      {/* 제목 + 설명 영역 */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          maxWidth: "900px",
        }}
      >
        {/* 제목 */}
        <div
          style={{
            fontSize: 60,
            fontWeight: 700,
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>

        {/* 설명 최대 한 줄 */}
        <div
          style={{
            fontSize: 30,
            opacity: 0.80,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "900px",
          }}
        >
          {description}
        </div>
      </div>

      {/* Views/Hop 배지 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 28,
          padding: "14px 36px",
          borderRadius: 9999,
          border: "3px solid #e5e7eb",
          fontSize: 30,
          alignSelf: "flex-end",
        }}
      >
        <span style={{ fontWeight: 700 }}>R³</span>
        <span>Views {views}</span>
        <span>Hop {hop}</span>
      </div>
    </div>
  ),
  size
);
