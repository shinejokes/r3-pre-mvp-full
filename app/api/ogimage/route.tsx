import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

export const runtime = "edge";
export const dynamic = "force-dynamic";

function card(text: string) {
  return new ImageResponse(
    <div style={{
      width: 1200, height: 630, background: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#000", fontSize: 64, fontWeight: 700,
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial',
    }}>{text}</div>,
    { width: 1200, height: 630, headers: { "Cache-Control": "no-store" } }
  );
}

export async function GET(req: NextRequest) {
  const ref = (new URL(req.url).searchParams.get("shareId") || "").trim();
  if (!ref) return card("No shareId");

  const supabase = supabaseServer();
  const { data: share, error } = await supabase
    .from("r3_shares")
    .select("id, ref_code, message_id")
    .eq("ref_code", ref)
    .maybeSingle();

  if (error) return card("Share query error");
  if (!share) return card("Share not found");

  return card(`share.id = ${share.id}`);
}


