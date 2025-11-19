// app/api/share-child/route.ts
import { NextRequest } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

export const runtime = "edge";

// ref_code용 간단한 랜덤 문자열 생성기
function generateRefCode(length = 7): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parentRef: string | undefined = body?.parentRef;

    if (!parentRef) {
      return new Response("Missing parentRef", { status: 400 });
    }

    const supabase = supabaseServer();

    // 1) 부모 share 찾기
    const { data: parent, error: parentErr } = await supabase
      .from("r3_shares")
      .select("id, message_id, hop")
      .eq("ref_code", parentRef)
      .maybeSingle();

    if (parentErr || !parent) {
      console.error("Parent share not found:", parentErr);
      return new Response("Parent share not found", { status: 404 });
    }

    const newRef = generateRefCode();
    const newHop = (parent.hop ?? 1) + 1;

    // 2) 새 share 생성
    const { data: inserted, error: insertErr } = await supabase
      .from("r3_shares")
      .insert({
        message_id: parent.message_id,
        parent_share_id: parent.id,
        ref_code: newRef,
        hop: newHop,
      })
      .select("ref_code, hop")
      .maybeSingle();

    if (insertErr || !inserted) {
      console.error("Insert error:", insertErr);
      return new Response("Failed to create child share", { status: 500 });
    }

    // 3) 베이스 URL (없으면 현재 도메인에서 맞춰 쓰도록 origin 없이 ref만 반환)
    const baseUrl =
      process.env.R3_APP_BASE_URL || "https://r3-pre-mvp-full.vercel.app";

    const fullUrl = `${baseUrl.replace(/\/$/, "")}/r/${inserted.ref_code}`;

    return Response.json({
      ok: true,
      ref_code: inserted.ref_code,
      hop: inserted.hop,
      url: fullUrl,
    });
  } catch (err) {
    console.error("share-child API error:", err);
    return new Response("share-child error", { status: 500 });
  }
}
