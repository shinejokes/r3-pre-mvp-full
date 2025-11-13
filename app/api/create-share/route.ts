// app/api/create-share/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

// 7~8글자 ref_code 생성기 (간단 버전)
function createRefCode(length: number = 7) {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export async function POST(req: NextRequest) {
  const supabase = supabaseServer();

  // 0) 요청에서 title, originalUrl 꺼내기
  const { title, originalUrl } = await req.json();

  if (!originalUrl) {
    return NextResponse.json(
      { error: "originalUrl is required" },
      { status: 400 }
    );
  }

  try {
    // 📌 Step 1 — 메시지 저장 (r3_messages 테이블)
    const { data: message, error: messageError } = await supabase
      .from("r3_messages")
      .insert({
        title: title || null,
        original_url: originalUrl,
      })
      .select()
      .single();

    if (messageError || !message) {
      console.error("messageError:", messageError);
      return NextResponse.json(
        { error: "Failed to insert message" },
        { status: 500 }
      );
    }

    // 📌 Step 2 — 공유 레코드 생성 (r3_shares 테이블)
    const ref = createRefCode(); // 7~8 글자 코드 생성

    const { error: shareError } = await supabase
      .from("r3_shares")
      .insert({
        ref_code: ref,
        message_id: message.id,
      });

    if (shareError) {
      console.error("shareError:", shareError);
      return NextResponse.json(
        { error: "Failed to insert share record" },
        { status: 500 }
      );
    }

    // 📌 Step 3 — /r/[ref] 링크 만들기
    const origin =
      req.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const shareUrl = `${origin}/r/${ref}`;

    // 프론트에서 쓸 수 있게 shareUrl과 ref 반환
    return NextResponse.json(
      {
        shareUrl,
        ref,
        messageId: message.id,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("create-share route error:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
