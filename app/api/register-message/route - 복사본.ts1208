// app/api/register-message/route.ts
import { NextRequest } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

export const runtime = "nodejs";

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
    const body = await req.json().catch(() => ({}));

    const originalUrl = body?.originalUrl as string | undefined;
    const title = (body?.title as string | undefined) ?? null;
    const description = (body?.description as string | undefined) ?? null;

    // 원본 URL이 없으면 에러
    if (!originalUrl) {
      return Response.json(
        { ok: false, error: "originalUrl is required" },
        { status: 400 }
      );
    }

    const supabase = supabaseServer();

    // 1) r3_messages에 메시지 저장
    const { data: msg, error: msgError } = await supabase
      .from("r3_messages")
      .insert({
        original_url: originalUrl,
        url: originalUrl, // 현재는 원본 URL과 동일
        title,
        description,
      })
      .select("id, original_url, title")
      .single();

    if (msgError || !msg) {
      console.error("register-message: messages insert error:", msgError);
      return Response.json(
        { ok: false, error: "Failed to create message" },
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
        // 여기서부터가 핵심: 썸네일/리다이렉트에 필요한 필드 모두 채움
        original_url: msg.original_url,
        target_url: msg.original_url,
        title: msg.title,
      })
      .select("ref_code, hop")
      .single();

    if (shareError || !share) {
      console.error("register-message: shares insert error:", shareError);
      return Response.json(
        { ok: false, error: "Failed to create first share" },
        { status: 500 }
      );
    }

    // 3) 프런트에서 보여 줄 공유 URL 만들기
    const baseUrl =
      process.env.R3_APP_BASE_URL ??
      process.env.NEXT_PUBLIC_APP_BASE_URL ??
      process.env.NEXT_PUBLIC_BASE_URL ??
      "http://localhost:3000";

    const shareUrl = `${baseUrl.replace(/\/$/, "")}/r/${share.ref_code}`;

    console.log("register-message OK:", {
      messageId: msg.id,
      refCode: share.ref_code,
      hop: share.hop,
      shareUrl,
    });

    return Response.json({
      ok: true,
      messageId: msg.id,
      refCode: share.ref_code,
      hop: share.hop,
      shareUrl,
    });
  } catch (err) {
    console.error("register-message API error:", err);
    return Response.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
