// app/api/share/route.ts
import { NextRequest } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

export const runtime = "nodejs";

// ref_code 생성기 (messages / share-child와 동일한 규칙)
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
    const messageId = body?.messageId as string | undefined;

    if (!messageId) {
      return Response.json(
        { ok: false, error: "messageId is required" },
        { status: 400 }
      );
    }

    const supabase = supabaseServer();

    // 1) 메시지 정보 읽기 (원본 URL / 제목)
    const { data: msg, error: msgError } = await supabase
      .from("r3_messages")
      .select("id, original_url, title")
      .eq("id", messageId)
      .maybeSingle();

    if (msgError) {
      console.error("share: message select error", msgError);
      return Response.json(
        { ok: false, error: "Failed to load message" },
        { status: 500 }
      );
    }
    if (!msg) {
      return Response.json(
        { ok: false, error: "Message not found" },
        { status: 404 }
      );
    }

    // 2) 첫 번째 share 행 INSERT (hop = 1)
    const refCode = generateRefCode();

    const { data: share, error: shareError } = await supabase
      .from("r3_shares")
      .insert({
        message_id: msg.id,
        parent_share_id: null,
        ref_code: refCode,
        hop: 1,
        views: 0,
        // 썸네일 / 리다이렉트에 필요한 필드들
        original_url: msg.original_url,
        target_url: msg.original_url,
        title: msg.title,
      })
      .select("id, ref_code, hop")
      .single();

    if (shareError || !share) {
      console.error("share: insert error", shareError);
      return Response.json(
        { ok: false, error: "Failed to create share" },
        { status: 500 }
      );
    }

    // 3) 프론트에서 사용할 전체 URL
    const baseUrl =
      process.env.R3_APP_BASE_URL ??
      process.env.NEXT_PUBLIC_APP_BASE_URL ??
      process.env.NEXT_PUBLIC_BASE_URL ??
      "https://r3-pre-mvp-full.vercel.app";

    const fullUrl = `${baseUrl.replace(/\/$/, "")}/r/${share.ref_code}`;

    return Response.json({
      ok: true,
      shareId: share.id,
      refCode: share.ref_code,
      hop: share.hop,
      url: fullUrl,
    });
  } catch (err) {
    console.error("share API error", err);
    return Response.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
