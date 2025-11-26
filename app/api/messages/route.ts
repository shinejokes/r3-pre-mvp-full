// app/api/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

// 7자리 랜덤 ref_code 생성기
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

    const baseUrl =
      process.env.R3_APP_BASE_URL || "https://r3-pre-mvp-full.vercel.app";

    // ----------------------------------------------------
    // ❶ parentRefCode가 있는 경우 = "내 링크 만들기"
    //    -> 기존 message를 재사용하고, share만 새로 만든다
    // ----------------------------------------------------
    if (parentRefCode) {
      // 1) 부모 share 찾기 (message_id 포함)
      const { data: parentShare, error: parentError } = await supabase
        .from("r3_shares")
        .select(
          "id, hop, message_id, title, original_url, target_url"
        )
        .eq("ref_code", parentRefCode)
        .maybeSingle();

      if (parentError || !parentShare) {
        console.error("parent share not found:", parentError);
        return NextResponse.json(
          { ok: false, error: "부모 공유 링크를 찾을 수 없습니다." },
          { status: 400 }
        );
      }

      const parentHop = parentShare.hop ?? 1;
      const newHop = parentHop + 1;

      // 원본/타겟 URL, 제목은 부모 기준 + body override
      const finalOriginalUrl =
        parentShare.original_url ||
        parentShare.target_url ||
        originalUrl ||
        "";
      const finalTargetUrl =
        targetUrl ||
        parentShare.target_url ||
        parentShare.original_url ||
        originalUrl ||
        "";

      if (!finalOriginalUrl) {
        return NextResponse.json(
          { ok: false, error: "originalUrl이 필요합니다." },
          { status: 400 }
        );
      }

      const finalTitle = title ?? parentShare.title ?? null;

      const newRefCode = generateRefCode(7);

      // 2) 새 share 생성 (message_id는 부모와 동일)
      const { data: newShare, error: shareError } = await supabase
        .from("r3_shares")
        .insert({
          message_id: parentShare.message_id,
          ref_code: newRefCode,
          title: finalTitle,
          original_url: finalOriginalUrl,
          target_url: finalTargetUrl,
          parent_share_id: parentShare.id,
          hop: newHop,
          views: 0,
        })
        .select("id, hop, ref_code")
        .single();

      if (shareError || !newShare) {
        console.error("insert child r3_shares error:", shareError);
        return NextResponse.json(
          { ok: false, error: "공유 링크 생성에 실패했습니다." },
          { status: 500 }
        );
      }

      const shareUrl = `${baseUrl}/r/${newShare.ref_code}`;

      return NextResponse.json(
        {
          ok: true,
          shareUrl,
          refCode: newShare.ref_code,
          messageId: parentShare.message_id,
          shareId: newShare.id,
          hop: newShare.hop,
        },
        { status: 200 }
      );
    }

    // ----------------------------------------------------
    // ❷ parentRefCode가 없는 경우 = "원본 메시지 신규 등록"
    //    -> 새 message + 첫 share (hop = 1)
    // ----------------------------------------------------
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

    const refCode = generateRefCode(7);

    // 2) 첫 share 생성 (hop = 1)
    const { data: share, error: shareError } = await supabase
      .from("r3_shares")
      .insert({
        message_id: message.id,
        ref_code: refCode,
        title: title ?? null,
        original_url: originalUrl,
        target_url: finalTargetUrl,
        parent_share_id: null,
        hop: 1,
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
      {
        ok: false,
        error: "알 수 없는 서버 오류",
        detail: String(e?.message ?? e),
      },
      { status: 500 }
    );
  }
}
