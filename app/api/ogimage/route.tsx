import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const ref = (url.searchParams.get("shareId") || "").trim();

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200, height: 630, background: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#000", fontSize: 72, fontWeight: 700,
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial',
        }}
      >
        {ref ? `shareId = ${ref}` : "No shareId"}
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "no-store" } }
  );
}

