// app/api/ogimage/route.tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = url.searchParams.get("shareId");
  const shareId = raw && raw !== "undefined" ? raw : "unknown"; // ← 가드

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 64,
          fontFamily: "system-ui, Segoe UI, Helvetica, Arial",
        }}
      >
        R3 • {shareId}
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control":
          "public, max-age=300, s-maxage=600, stale-while-revalidate=86400",
      },
    }
  );
}
