// app/api/register-message/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

// 간단한 refCode 생성기 (7글자)
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
    const payload = await req.json();
    console.log("register-message payload:", payload);

    // 프론트에서 보내는 필드 이름에 맞게 조정
    const { originalUrl, title, note } = payload;

    if (!originalUrl) {
      return NextResponse.json(
        { error: "originalUrl 필드가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = supabaseServer();

    // 1) r3_messages 에 메시지 저장
    const {
      data: message,
      error: messageError,
    } = await supabase
      .from("r3_messages") // 테이블 이름: public.r3_messages
      .insert({
        origin_url: originalUrl, // 컬럼 이름: origin_url
        title: title ?? null,
        creator_hint: null,
        url: originalUrl,
        description: note ?? null,
        registrant_id: null,
      })
      .select()
      .single();

    if (messageError || !message) {
      console.error(
        "Supabase insert error in register-message (messages):",
        messageError
      );
      return NextResponse.json(
        {
          error: "DB insert 실패 (messages)",
          details: messageError?.message ?? null,
        },
        { status: 500 }
      );
    }

    // 2) r3_shares 에 첫 번째 share 생성
    const refCode = generateRefCode(7);

    const {
      data: share,
      error: shareError,
    } = await supabase
      .from("r3_shares") // 테이블 이름: public.r3_shares
      .insert({
        message_id: message.id, // r3_messages.id 를 FK로 사용
        ref_code: refCode,
        hop: 1, // 최초 공유이므로 hop=1 (또는 0 으로 해도 무방)
      })
      .select()
      .single();

    if (shareError || !share) {
      console.error(
        "Supabase insert error in register-message (shares):",
        shareError
      );
      // 메시지는 이미 등록되었으므로, ok는 true 이지만 shareUrl은 null 로 보냄
      return NextResponse.json(
        {
          ok: true,
          messageId: message.id,
          shareUrl: null,
          details: shareError?.message ?? null,
        },
        { status: 200 }
      );
    }

    // 3) 현재 요청의 origin 기준으로 shareUrl 생성
    const origin = req.nextUrl.origin; // 예: https://r3-pre-mvp-full.vercel.app
    const shareUrl = `${origin}/r/${share.ref_code}`;

    return NextResponse.json(
      {
        ok: true,
        messageId: message.id,
        refCode: share.ref_code,
        shareUrl, // ★ 프론트에서 기대하는 필드
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("register-message route error:", err);
    return NextResponse.json(
      {
        error: "서버 내부 오류",
        details: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
