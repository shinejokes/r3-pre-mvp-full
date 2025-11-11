// app/api/ogimage/route.tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";

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
          background: "white",
          color: "black",
          fontSize: 64,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        R3 • {shareId}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
