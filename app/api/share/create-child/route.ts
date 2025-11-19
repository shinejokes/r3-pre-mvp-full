// app/api/share/create-child/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";

// 간단한 ref_code 생성기
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
    const body = await req.json();
    const ref = body?.ref as string | undefined;

    if (!ref || typeof ref !== "string") {
      return NextResponse.json(
        { error: "ref 값이 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = supabaseServer();

    // 1) ref_code로 부모 share 찾기
    const { data: parent, error: parentError } = await supabase
      .from("r3_shares")
      .select("id, message_id, hop")
      .eq("ref_code", ref)
      .single();

    if (parentError || !parent) {
      return NextResponse.json(
        { error: "원본 공유를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const newHop = (parent.hop ?? 0) + 1;
    const newRefCode = generateRefCode();

    // 2) 새 share row 삽입
    const { data: child, error: insertError } = await supabase
      .from("r3_shares")
      .insert({
        message_id: parent.message_id,
        parent_share_id: parent.id,
        hop: newHop,
        ref_code: newRefCode,
      })
      .select("id, ref_code")
      .single();

    if (insertError || !child) {
      console.error("insertError", insertError);
      return NextResponse.json(
        { error: "새 공유를 생성하지 못했습니다." },
        { status: 500 }
      );
    }

    // 3) 새 ref_code를 반환
    return NextResponse.json({ ref_code: child.ref_code }, { status: 200 });
  } catch (err) {
    console.error("create-child-share error", err);
    return NextResponse.json(
      { error: "서버 내부 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
