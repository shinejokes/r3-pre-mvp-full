// app/api/register-message/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title: string = body.title?.trim() ?? "";
    const originalUrl: string = body.originalUrl?.trim() ?? "";

    if (!originalUrl) {
      return NextResponse.json(
        { error: "originalUrl is required" },
        { status: 400 }
      );
    }

    const supabase = supabaseServer();

    // 1) 메시지 저장
    const { data: message, error: messageError } = await supabase
      .from("r3_messages")
      .insert({
        title,
        original_url: originalUrl,
      })
      .select("id")
      .single();

    if (messageError || !message) {
      console.error("message insert error", messageError);
      return NextResponse.json(
        { error: "failed to insert message" },
        { status: 500 }
      );
    }

    // 2) 공유 코드(ref_code) 생성
    const refCode = nanoid(8);

    // 3) shares row 저장
    const { error: shareError } = await supabase.from("r3_shares").insert({
      message_id: message.id,
      ref_code: refCode,
      target_url: originalUrl, // 필요에 따라 변경
      views: 0,
      hop: 1,
    });

    if (shareError) {
      console.error("share insert error", shareError);
      return NextResponse.json(
        { error: "failed to insert share" },
        { status: 500 }
      );
    }

    // 4) shareUrl 생성해서 응답
    const base =
      process.env.R3_APP_BASE_URL || "https://r3-pre-mvp-full.vercel.app";

    const shareUrl = `${base}/r/${refCode}`;

    return NextResponse.json(
      {
        ok: true,
        refCode,
        shareUrl,
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("register-message fatal error", e);
    return NextResponse.json(
      { error: "unexpected error" },
      { status: 500 }
    );
  }
}
