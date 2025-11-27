// app/api/register-message/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";

export const runtime = "edge";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function supabaseServer(){
  return createClient(SUPABASE_URL, SERVICE_KEY, {auth:{persistSession:false}});
}

export async function POST(req: NextRequest) {
  try {
    const { title, originalUrl } = await req.json();

    const supabase = supabaseServer();

    // 1) 메시지 원본 저장
    const { data: message, error: messageError } = await supabase
      .from("messages")   // ✅ 이미 잘되던 테이블
      .insert({ title, original_url: originalUrl })
      .select("id")
      .single();

    if (messageError || !message) {
      console.error("message insert error:", messageError);
      return NextResponse.json({ error: "메시지 insert 실패" }, { status: 500 });
    }

    // 2) ShareId 생성
    const refCode = nanoid(8);

    // 3) shares 저장
    const { error: shareError } = await supabase
      .from("shares")  // ✅ 기존 shares 테이블
      .insert({
        message_id: message.id,
        ref_code: refCode,
        target_url: originalUrl,
        original_url: originalUrl,
        views: 0,
        hop: 1,
      });

    if (shareError) {
      console.error("share insert error:", shareError);
      return NextResponse.json({ error: "share insert 실패" }, { status: 500 });
    }

    // 4) 최종 공유 URL
    const base = process.env.R3_APP_BASE_URL!;
    const shareUrl = `${base}/${refCode}`;

    return NextResponse.json({ shareUrl, refCode, ok: true }, { status: 200 });

  } catch (err) {
    console.error("fatal:", err);
    return NextResponse.json({ error: "예상치 못한 오류" }, { status: 500 });
  }
}
