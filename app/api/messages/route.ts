// app/api/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

// 7자리 랜덤 ref_code 생성기
function generateRefCode(length = 7) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const { title, url } = await req.json();

    if (!title || !url) {
      return NextResponse.json(
        { error: "title과 url은 필수입니다." },
        { status: 400 }
      );
    }

    const supabase = supabaseServer();

    // 1) r3_messages에 메시지 저장
    //    - 실제 스키마에 맞춰 origin_url, url 모두 채워줌
    const { data: message, error: messageError } = await supabase
      .from("r3_messages")
      .insert({
        title,
        origin_url: url,
        url,
      })
      .select()
      .single();

    if (messageError || !message) {
      console.error("message insert error:", messageError);
      return NextResponse.json(
        { error: "메시지 저장 중 오류 발생", detail: messageError },
        { status: 500 }
      );
    }

    // 2) r3_shares에 hop=1 share 생성
    //    - 스키마 상 두 번째 컬럼이 message 쪽 uuid라서 message_uuid로 가정
    const refCode = generateRefCode();
    const { data: share, error: shareError } = await supabase
      .from("r3_shares")
      .insert({
        message_uuid: message.uuid, // ★ 중요: message_id가 아니라 message.uuid 사용
        ref_code: refCode,
        hop: 1,
      })
      .select()
      .single();

    if (shareError || !share) {
      console.error("share insert error:", shareError);
      return NextResponse.json(
        { error: "share 생성 중 오류 발생", detail: shareError },
        { status: 500 }
      );
    }

    // 3) 공유 링크 URL 생성
    const origin = req.nextUrl.origin; // 예: https://r3-pre-mvp-full.vercel.app
    const shareUrl = `${origin}/r/${share.ref_code}`;

    // 4) 프론트로 JSON 응답
    return NextResponse.json({
      ok: true,
      shareUrl,
      messageId: message.id,
      messageUuid: message.uuid,
      shareId: share.id,
      hop: share.hop,
    });
  } catch (e: any) {
    console.error("messages API fatal error:", e);
    return NextResponse.json(
      { error: "알 수 없는 서버 오류", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
