// app/api/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

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
  const supabase = supabaseServer();

  try {
    const body = await req.json();

    const {
      originalUrl,
      title,
      targetUrl,
      parentRefCode,
    }: {
      originalUrl?: string;
      title?: string;
      targetUrl?: string;
      parentRefCode?: string;
    } = body || {};

    if (!originalUrl) {
      return NextResponse.json(
        { ok: false, error: "originalUrl이 필요합니다." },
        { status: 400 }
      );
    }

    const finalTargetUrl = targetUrl || originalUrl;

    // 1) 메시지 생성
    const { data: message, error: messageError } = await supabase
      .from("r3_messages")
      .insert({
        origin_url: originalUrl,
        title: title ?? null,
        url: finalTargetUrl,
      })
      .select("id, uuid")
      .single();

    if (messageError || !message) {
      console.error("insert r3_messages error:", messageError);
      return NextResponse.json(
        { ok: false, error: "메시지 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    // 2) hop 계산 (부모가 있으면 부모 hop+1, 없으면 1)
    let hop = 1;
    let parentShareId: number | null = null;

    if (parentRefCode) {
      const { data: parentShare, error: parentError } = await supabase
        .from("r3_shares")
        .select("id, hop")
        .eq("ref_code", parentRefCode)
        .maybeSingle();

      if (parentError || !parentShare) {
        console.error("parent share not found:", parentError);
        return NextResponse.json(
          { ok: false, error: "부모 공유 링크를 찾을 수 없습니다." },
          { status: 400 }
        );
      }

      parentShareId = parentShare.id;
      hop = (parentShare.hop ?? 0) + 1;
    }

    // 3) 새 share 레코드 생성
    const refCode = generateRefCode(7);

    const { data: share, error: shareError } = await supabase
      .from("r3_shares")
      .insert({
        message_id: message.id,
        ref_code: refCode,
        title: title ?? null,
        original_url: originalUrl,
        target_url: finalTargetUrl,
        parent_share_id: parentShareId,
        hop,
        views: 0,
      })
      .select("id, hop, ref_code")
      .single();

    if (shareError || !share) {
      console.error("insert r3_shares error:", shareError);
      return NextResponse.json(
        { ok: false, error: "공유 링크 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    const baseUrl =
      process.env.R3_APP_BASE_URL || "https://r3-pre-mvp-full.vercel.app";

    const shareUrl = `${baseUrl}/r/${share.ref_code}`;

    return NextResponse.json(
      {
        ok: true,
        shareUrl,
        refCode: share.ref_code,
        messageId: message.id,
        messageUuid: message.uuid,
        shareId: share.id,
        hop: share.hop,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("messages API fatal error:", e);
    return NextResponse.json(
      { ok: false, error: "알 수 없는 서버 오류", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
