import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

export const runtime = "edge";
export const dynamic = "force-dynamic";

function card(lines: string[]) {
  return new ImageResponse(
    <div style={{
      width: 1200, height: 630, background: "#fff",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      color: "#000", fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial'
    }}>
      <div style={{ fontSize: 60, fontWeight: 800, marginBottom: 12 }}>{lines[0]}</div>
      <div style={{ fontSize: 40, opacity: 0.85 }}>{lines[1] ?? ""}</div>
    </div>,
    { width: 1200, height: 630, headers: { "Cache-Control": "no-store" } }
  );
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const ref = (url.searchParams.get("shareId") || "").trim();
  if (!ref) return card(["No shareId"]);

  const supabase = supabaseServer();

  // shares
  const { data: share } = await supabase
    .from("r3_shares")
    .select("id, message_id")
    .eq("ref_code", ref)
    .maybeSingle();
  if (!share) return card(["Share not found"]);

  // hits count by share_id (TEXT)
  const { count } = await supabase
    .from("r3_hits")
    .select("*", { count: "exact", head: true })
    .eq("share_id", share.id);

  const views = count ?? 0;
  return card([`Views: ${views}`, `Share ID: ${ref}`]);
}
