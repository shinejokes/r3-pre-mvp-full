// app/api/ogimage/route.tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET() {
  // 텍스트/폰트 문제를 피하려고 아주 단순한 박스로 시작
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "linear-gradient(135deg, #222, #666)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ width: 800, height: 300, borderRadius: 32, background: "#ffd54f" }} />
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "no-store" } }
  );
}
