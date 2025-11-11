// app/api/ogimage/route.tsx
import { ImageResponse } from "next/og";

export const runtime = "edge"; // 권장: OG는 edge가 빠름

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const shareId = searchParams.get("shareId") ?? "unknown";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 72,
          fontFamily: "system-ui, Segoe UI, Helvetica, Arial",
        }}
      >
        R3 • {shareId}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
