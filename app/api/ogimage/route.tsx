/* eslint-disable react/jsx-key */
import { ImageResponse } from "next/og";
export const runtime = "edge";

// 1200x630, PNG
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const shareId = searchParams.get("shareId") || "unknown";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "white",
        }}
      >
        <div
          style={{
            fontSize: 56,
            lineHeight: 1.2,
            fontWeight: 700,
            fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, sans-serif",
            textAlign: "center",
            padding: "48px 80px",
            border: "8px solid black",
          }}
        >
          R3 공유 링크
          <div
            style={{
              marginTop: 24,
              fontSize: 36,
              fontWeight: 500,
            }}
          >
            shareId: {shareId}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
