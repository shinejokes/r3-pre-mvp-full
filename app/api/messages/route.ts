// app/api/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// 🔧 여기서는 supabaseServer() 안 쓰고,
//    env.local 에 이미 있는 공개키(NEXT_PUBLIC_...)를 그대로 사용합니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// env 빠져 있으면 바로 에러 리턴
if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase env missing", { supabaseUrl, supabaseKey });
}

const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      })
    : null;

// ref_code용 랜덤 문자열 생성기
function generateRefCode(length = 7): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export async function POST(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Supabase is not configured" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({} as any));

    const originalUrl: string | undefined = body?.originalUrl;
    const title: string | null =
      (body?.title as string | undefined) ?? null;
    const description: string | null =
      (body?.description as string | undefined) ?? null;

    if (!originalUrl) {
      return NextResponse.json(
        { ok: false, error: "originalUrl is required" },
        { status: 400 }
      );
    }

    // 1) r3_messages에 메시지 저장
    const { data: msg, error: msgError } = await supabase
      .from("r3_messages")
      .insert({
        original_url: originalUrl,
        url: originalUrl, // 지금은 원본 URL과 동일
        title,
        description,
      })
      .select("id, original_url, title")
      .single();

    if (msgError || !msg) {
      console.error("messages insert error:", msgError);
      return NextResponse.json(
        {
          ok: false,
          step: "insert-message",
          error: msgError?.message ?? "Failed to create message",
        },
        { status: 500 }
      );
    }

    // 2) 첫 번째 share 행 생성 (hop = 1)
    const refCode = generateRefCode();

    const { data: share, error: shareError } = await supabase
      .from("r3_shares")
      .insert({
        message_id: msg.id,
        parent_share_id: null,
        ref_code: refCode,
        hop: 1,
        views: 0,
        original_url: msg.original_url,
        target_url: msg.original_url,
        title: msg.title,
      })
      .select("ref_code, hop")
      .single();

    if (shareError || !share) {
      console.error("shares insert error:", shareError);
      return NextResponse.json(
        {
          ok: false,
          step: "insert-share",
          error: shareError?.message ?? "Failed to create first share",
        },
        { status: 500 }
      );
    }

    // 3) 프론트에서 사용할 전체 URL
    const baseUrl =
      process.env.R3_APP_BASE_URL ??
      process.env.NEXT_PUBLIC_APP_BASE_URL ??
      process.env.NEXT_PUBLIC_BASE_URL ??
      "https://r3-pre-mvp-full.vercel.app";

    const shareUrl = `${baseUrl.replace(/\/$/, "")}/r/${share.ref_code}`;

    return NextResponse.json({
      ok: true,
      messageId: msg.id,
      refCode: share.ref_code,
      hop: share.hop,
      shareUrl,
    });
  } catch (err: any) {
    console.error("messages API error:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
