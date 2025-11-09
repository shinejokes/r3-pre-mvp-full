import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const ref = (url.searchParams.get("ref") || "").trim();
  const ua = req.headers.get("user-agent") || "";
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0]?.trim() || null;

  const supabase = supabaseServer();

  // ref_code → share 조회
  const { data: share, error: sErr } = await supabase
    .from("r3_shares")
    .select("id, ref_code")
    .eq("ref_code", ref)
    .maybeSingle();

  if (sErr || !share) {
    return NextResponse.json({ ok: false, stage: "share", sErr: String(sErr), share }, { status: 200 });
  }

  // hits insert
  const fp = `${ip ?? "noip"}|${ua.slice(0, 160)}`;
  const { error: insErr } = await supabase.from("r3_hits").insert({
    share_id: (share.id ?? "").toString().trim(),
    viewer_fingerprint: fp,
  });

  // 카운트
  const { count, error: cntErr } = await supabase
    .from("r3_hits")
    .select("*", { count: "exact", head: true })
    .eq("share_id", (share.id ?? "").toString().trim());

  return NextResponse.json({
    ok: !insErr,
    stage: insErr ? "insert" : "done",
    ref,
    share_id: share.id,
    insert_error: insErr ? String(insErr) : null,
    count_error: cntErr ? String(cntErr) : null,
    hits_count: count ?? 0,
  });
}
