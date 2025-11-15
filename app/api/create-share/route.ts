import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

function generateRefCode(length = 6) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

// ✅ 이 GET 핸들러를 맨 위쪽에 추가
export async function GET() {
  return NextResponse.json({ message: "create-share GET OK (from new route.ts)" });
}

export async function POST(req: NextRequest) {
  const supabase = supabaseServer();
  const { messageId, parentShareId } = await req.json();

  if (!messageId) {
    return NextResponse.json({ error: "messageId is required" }, { status: 400 });
  }

  let hop = 1;

  if (parentShareId) {
    const { data: parent, error: parentError } = await supabase
      .from("r3_shares")
      .select("hop")
      .eq("ref_code", parentShareId)
      .maybeSingle();

    if (parentError) {
      console.error("Error fetching parent share:", parentError);
    }

    if (parent && parent.hop) {
      hop = parent.hop + 1;
    }
  }

  const refCode = generateRefCode();

  const { data, error } = await supabase.from("r3_shares").insert({
    ref_code: refCode,
    message_id: messageId,
    hop: hop,
  });

  if (error) {
    console.error("Supabase insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ refCode, hop });
}
