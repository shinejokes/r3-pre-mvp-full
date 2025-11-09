import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

export const runtime = "edge";
export const dynamic = "force-dynamic";

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function renderCard(title: string, subtitle: string, ref: string, views: number, host: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "linear-gradient(135deg, #ffffff, #f5f5f5)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#111",
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial',
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 800, marginBottom: 18, textAlign: "center" }}>
          {truncate(title, 28)}
        </div>
        <div style={{ fontSize: 42, opacity: 0.9, marginBottom: 28, textAlign: "center" }}>
          {truncate(subtitle, 46)}
        </div>
        <div style={{ fontSize: 44, marginBottom: 8 }}>
          <span style={{ opacity: 0.6 }}>Share ID:</span>&nbsp;
          <span style={{ color: "#d32f2f" }}>{ref}</span>
        </div>
        <div style={{ fontSize: 44, marginBottom: 24 }}>
          <span style={{ opacity: 0.6 }}>Views:</span>&nbsp;
          <span style={{ color: "#1976d2" }}>{String(views)}</span>
        </div>
        <div style={{ fontSize: 30, opacity: 0.5 }}>{host}</div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "no-store" } }
  );
}

function getHost(req: NextRequest) {
  return req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const ref = (url.searchParams.get("shareId") || "").trim();
  const host = getHost(req);

  if (!ref) {
    return renderCard("R3 pre-MVP", "No shareId", "-", 0, host);
  }

  try {
    const supabase = supabaseServer();

    // 1) share
    const { data: share } = await supabase
      .from("r3_shares")
      .select("id, message_id")
      .eq("ref_code", ref)
      .maybeSingle();
    if (!share) {
      return renderCard("R3 pre-MVP", "Share not found", ref, 0, host);
    }

    // 2) message (title, description, url, origin_url)
    const mid = (share.message_id ?? "").toString().trim();
    const { data: msg } = await supabase
      .from("r3_messages")
      .select("title, description, url, origin_url")
      .eq("id", mid)
      .maybeSingle();

    const title = msg?.title ?? "R3 pre-MVP";
    const subtitle = msg?.description ?? msg?.url ?? msg?.origin_url ?? host;

    // 3) hits count
    const { count } = await supabase
      .from("r3_hits")
      .select("*", { count: "exact", head: true })
      .eq("share_id", share.id);
    const views = count ?? 0;

    // 4) render
    return renderCard(title, subtitle, ref, views, host);
  } catch (err) {
    return renderCard("R3 pre-MVP", "Error in OGImage", ref, 0, getHost(req));
  }
}
