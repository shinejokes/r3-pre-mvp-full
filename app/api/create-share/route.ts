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

  const { title, originalUrl } = await req.json();

  if (!originalUrl) {
    return NextResponse.json(
      { error: "originalUrl is required" },
      { status: 400 }
    );
  }

  try {
    // 📌 이번 버전에서는 r3_messages는 사용하지 않고
    //    모든 정보를 r3_shares 테이블에만 저장합니다.

    const ref = createRefCode(); // 7~8 글자 코드 생성

    const { error: shareError } = await supabase
      .from("r3_shares")
      .insert({
        ref_code: ref,
        title: title || null,
        original_url: originalUrl, // 스키마에 있는 컬럼
        target_url: originalUrl,   // 리다이렉트 용도로도 동일하게 저장
      });

    if (shareError) {
      console.error("shareError:", shareError);
      return NextResponse.json(
        { error: "Failed to insert share record" },
        { status: 500 }
      );
    }

    // /r/[ref] 링크 만들기
    const origin =
      req.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const shareUrl = `${origin}/r/${ref}`;

    return NextResponse.json(
      {
        shareUrl,
        ref,
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
