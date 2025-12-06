// app/api/ogimage/route.ts
import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { supabaseServer } from "../../../lib/supabaseServer";

export const runtime = "edge";

const size = {
  width: 1200,
  height: 630,
};

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
  const { data, error } = await supabaseServer
    .from("r3_shares")
    .select("title, views, hop")
    .eq("ref_code", shareId)
    .single();

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
        {/* 상단 R3 라벨 */}
        <div
          style={{
            fontSize: 32,
            letterSpacing: 6,
            textTransform: "uppercase",
            opacity: 0.9,
          }}
        >
          R3 HAND-FORWARDED LINK
        </div>

        {/* 가운데 제목 */}
        <div
          style={{
            fontSize: 60,
            fontWeight: 700,
            lineHeight: 1.1,
            maxWidth: "900px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>{title}</span>
        </div>

        {/* 하단 영역: 설명 + Views/Hop 배지 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 40,
          }}
        >
          {/* 설명 한 줄 */}
          <div
            style={{
              fontSize: 28,
              opacity: 0.85,
              maxWidth: "700px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {description}
          </div>

          {/* Views / Hop 배지 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              padding: "14px 32px",
              borderRadius: 9999,
              border: "2px solid #e5e7eb",
              fontSize: 28,
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
