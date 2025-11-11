// app/api/ogimage/route.tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

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
          fontFamily: "system-ui, Segoe UI, Arial",
          fontSize: 56,
          background: "white",
        }}
      >
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <div style={{ fontWeight: 800 }}>R3</div>
          <div>|</div>
          <div>share: {shareId}</div>
        </div>
      </div>
    ),
    size
  );
}
