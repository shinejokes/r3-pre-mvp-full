// app/api/share-child/route.ts
import { NextRequest } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

export const runtime = "nodejs"; // Edge보다 Node가 Supabase INSERT엔 더 안정적

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
    const parentRefCode = body?.parentRefCode as string | undefined;

    if (!parentRefCode) {
      return Response.json(
        { ok: false, error: "parentRefCode is required" },
        { status: 400 }
      );
    }

    const supabase = supabaseServer();

    // 1) 부모 share 레코드 조회
    const { data: parent, error: parentError } = await supabase
      .from("r3_shares")
      .select(
        "id, ref_code, hop, original_url, target_url, title, thumbnail_url"
      )
      .eq("ref_code", parentRefCode)
      .maybeSingle();

    if (parentError) {
      console.error("share-child parent select error:", parentError);
      return Response.json(
        { ok: false, error: "Failed to load parent share" },
        { status: 500 }
      );
    }

    if (!parent) {
      return Response.json(
        { ok: false, error: "Parent share not found" },
        { status: 404 }
      );
    }

    // 2) 새 ref_code 생성
    const newRefCode = generateRefCode();

    // 3) 자식 share 레코드 INSERT
    const { data: insertedRows, error: insertError } = await supabase
      .from("r3_shares")
      .insert({
        parent_share_id: parent.id,
        ref_code: newRefCode,
        hop: (parent.hop ?? 0) + 1,
        // 부모에서 그대로 이어받는 필드들
        original_url: parent.original_url,
        target_url: parent.target_url,
        title: parent.title,
        thumbnail_url: parent.thumbnail_url,
        // 새 링크이므로 조회수는 0부터 시작
        views: 0,
      })
      .select("id, ref_code, hop")
      .limit(1);

    if (insertError) {
      console.error("share-child insert error:", insertError);
      return Response.json(
        { ok: false, error: "Failed to create child share" },
        { status: 500 }
      );
    }

    const inserted = insertedRows?.[0];
    if (!inserted) {
      return Response.json(
        { ok: false, error: "Child share not created" },
        { status: 500 }
      );
    }

    // 4) 프런트에서 사용할 전체 URL 생성
    const baseUrl =
      process.env.R3_APP_BASE_URL ??
      process.env.NEXT_PUBLIC_APP_BASE_URL ??
      process.env.NEXT_PUBLIC_BASE_URL ??
      "";

    const fullUrl = `${baseUrl.replace(/\/$/, "")}/r/${inserted.ref_code}`;

    return Response.json({
      ok: true,
      ref_code: inserted.ref_code,
      hop: inserted.hop,
      url: fullUrl, // ★ 프런트에서 이 값을 그대로 사용
    });
  } catch (err) {
    console.error("share-child API error:", err);
    return Response.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
