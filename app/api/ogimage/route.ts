// app/api/ogimage/route.ts
import { ImageResponse } from "next/og";

export const runtime = "edge"; // Vercel Edge Runtime 사용
export const alt = "R3 OG Image";
export const contentType = "image/png";

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
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px",
          background: "white",
          color: "black",
          fontSize: 48,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 56, fontWeight: 700 }}>R3 공유 링크</div>
        <div style={{ marginTop: 28, opacity: 0.75 }}>shareId: {shareId}</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
