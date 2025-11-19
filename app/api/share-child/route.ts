// app/api/share-child/route.ts
import { NextRequest } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

export const runtime = "nodejs"; // Edge보다 Node가 Supabase INSERT엔 더 안정적

// ref_code용 랜덤 문자열 생성기
function generateRefCode(length = 7): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parentRef: string | undefined = body?.parentRef;

    if (!parentRef) {
      return Response.json(
        { ok: false, error: "Missing parentRef" },
        { status: 400 }
      );
    }

    const supabase = supabaseServer();

    // 1) 부모 share 찾기 (r3_shares: id, message_id, hop, ref_code, parent_share_id ...)
    const { data: parent, error: parentErr } = await supabase
      .from("r3_shares")
      .select("id, message_id, hop")
      .eq("ref_code", parentRef)
      .maybeSingle();

    if (parentErr || !parent) {
      console.error("Parent share not found:", parentErr);
      return Response.json(
        { ok: false, error: "Parent share not found" },
        { status: 404 }
      );
    }

    const newRef = generateRefCode();
    const newHop = (parent.hop ?? 1) + 1;

    // 2) 새 share 생성 (테이블 컬럼 이름에 정확히 맞춤)
    const { data: inserted, error: insertErr } = await supabase
      .from("r3_shares")
      .insert({
        message_id: parent.message_id,
        parent_share_id: parent.id,
        ref_code: newRef,
        hop: newHop,
      })
      .select("ref_code, hop")
      .maybeSingle();

    if (insertErr || !inserted) {
      console.error("Insert child share error:", insertErr);
      return Response.json(
        { ok: false, error: "Failed to create child share" },
        { status: 500 }
      );
    }

    // 3) base URL 결정 (환경변수 → fallback 순서)
    const baseUrl =
      process.env.R3_APP_BASE_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "https://r3-pre-mvp-full.vercel.app";

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
