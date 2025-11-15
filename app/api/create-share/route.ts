import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

function generateRefCode(length = 6) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

export async function GET(req: NextRequest) {
  const supabase = supabaseServer();

  const url = new URL(req.url);
  const messageId = url.searchParams.get("messageId");
  const parentShareId = url.searchParams.get("parentShareId");

  // 1) messageId 필수
  if (!messageId) {
    return NextResponse.json(
      { error: "messageId query parameter is required" },
      { status: 400 }
    );
  }

  let hop = 1;

  // 2) parentShareId가 있으면 hop = parent.hop + 1
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

  // 3) 새로운 refCode 생성
  const refCode = generateRefCode();

  // 4) Supabase에 저장
  const { error } = await supabase.from("r3_shares").insert({
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
