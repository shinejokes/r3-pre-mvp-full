// app/api/og/[shareId]/route.ts
import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import React from "react";

// Next.js App Router의 Route Handler
export const runtime = "edge";

// 이건 GET /api/og/:shareId 형태로 호출된다고 가정합니다.
export async function GET(
  req: NextRequest,
  { params }: { params: { shareId: string } }
) {
  const { shareId } = params;

  // 여기서는 일단 shareId만 표시해 주자.
  // 나중에 DB에서 메시지/제목 등 불러와서 넣을 수 있음.
  const titleText = `R3 pre-MVP`;
  const shareText = `shareId: ${shareId}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#ffffff",
          color: "#000000",
          fontSize: 48,
          fontFamily: "sans-serif",
          padding: "40px",
          boxSizing: "border-box",
          border: "8px solid #000000",
        }}
      >
        <div
          style={{
            fontSize: 60,
            fontWeight: "bold",
            marginBottom: "24px",
          }}
        >
          {titleText}
        </div>

        <div
          style={{
            fontSize: 32,
            lineHeight: 1.4,
            textAlign: "center",
            maxWidth: "1000px",
            wordBreak: "break-word",
          }}
        >
          {shareText}
        </div>

        <div
          style={{
            marginTop: "32px",
            fontSize: 24,
            opacity: 0.6,
          }}
        >
          r3-pre-mvp-full
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
