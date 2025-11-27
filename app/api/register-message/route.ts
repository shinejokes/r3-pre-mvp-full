// app/api/register-message/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

export async function POST(req: NextRequest) {
  try {
    // 1) 프론트에서 보낸 JSON 읽기
    const payload = await req.json();
    console.log("register-message payload:", payload);

    // 예: originalUrl, title, note 같은 필드가 온다고 가정
    //    (자네 폼에서 사용하는 이름에 맞춰야 합니다.)
    const {
      originalUrl,
      title,
      note,
    } = payload;

    if (!originalUrl) {
      return NextResponse.json(
        { error: "originalUrl 필드가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = supabaseServer();

    // 2) Supabase insert
    // ⚠️ 여기에서 테이블/컬럼 이름을 Supabase 콘솔에서 보이는 그대로 맞춰 주세요.
    //    - 테이블이 r3-messages 라면: from("r3-messages")
    //    - 컬럼이 original_url, title, note 라면 아래처럼.
 
   const { data, error } = await supabase
  .from("r3_messages")  // 실제 테이블 이름
  .insert({
    origin_url: originalUrl,       // ★ 핵심 수정
    title: title ?? null,
    creator_hint: null,
    url: originalUrl,              // 필요시 유지
    description: note ?? null,
    registrant_id: null,
  })
  .select()
  .single();


    if (error) {
      console.error("Supabase insert error in register-message:", error);
      return NextResponse.json(
        {
          error: "DB insert 실패",
          details: error.message,
        },
        { status: 500 }
      );
    }

    // 3) 성공 응답
    return NextResponse.json(
      {
        ok: true,
        message: data,
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
