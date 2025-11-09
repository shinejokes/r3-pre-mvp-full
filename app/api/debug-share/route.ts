import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const ref = (url.searchParams.get("ref") || "").trim();
  const supabase = supabaseServer();

  const { data: share, error: shareErr } = await supabase
    .from("r3_shares")
    .select("id, ref_code, message_id, created_at")
    .eq("ref_code", ref)
    .maybeSingle();

  let message: any = null;
  if (share?.message_id) {
    const { data: m } = await supabase
      .from("r3_messages")
      .select("id, title, url, description")
      .eq("id", share.message_id)
      .maybeSingle();
    message = m ?? null;
  }

  return NextResponse.json({
    ref,
    shareErr: shareErr ? String(shareErr) : null,
    share,
    message,
  });
}
