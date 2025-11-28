// app/api/ogimage/route.ts
import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { supabaseServer } from "../../../lib/supabaseServer";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shareId = searchParams.get("shareId");

  if (!shareId) {
    return new Response("Missing shareId", { status: 400 });
  }

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("r3_shares")
    .select("title, views, hop")
    .eq("ref_code", shareId)
    .maybeSingle();

  if (error) {
    console.error("ogimage supabase error:", error);
  }

  const title = data?.title ?? "R3 Message";
  const views = data?.views ?? 0;
  const hop = data?.hop ?? 1;

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
          background: "linear-gradient(135deg,#020617,#111827)",
          color: "#f9fafb",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <div style={{ fontSize: 32, opacity: 0.8 }}>R3 · Message Link</div>

        <div
          style={{
            fontSize: 54,
            fontWeight: 700,
            lineHeight: 1.2,
            maxWidth: "1000px",
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: "flex",
            gap: 32,
            marginTop: 32,
            fontSize: 32,
          }}
        >
          <div
            style={{
              padding: "12px 24px",
              borderRadius: 999,
              background: "rgba(15,23,42,0.9)",
              border: "1px solid rgba(148,163,184,0.6)",
            }}
          >
            R3 Views&nbsp;{views}
          </div>
          <div
            style={{
              padding: "12px 24px",
              borderRadius: 999,
              background: "rgba(15,23,42,0.9)",
              border: "1px solid rgba(148,163,184,0.6)",
            }}
          >
            Hop&nbsp;{hop}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
