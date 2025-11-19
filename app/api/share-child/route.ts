// app/api/share-child/route.ts
import { NextRequest } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

export const runtime = "nodejs"; // Edge → Node 안정성 강화

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parentRef = body?.parentRef;

    if (!parentRef) {
      return Response.json(
        { ok: false, error: "Missing parentRef" },
        { status: 400 }
      );
    }

    // Supabase에서 parent share 조회
    const supabase = supabaseServer();
    const { data: parent, error: parentErr } = await supabase
      .from("r3_shares")
      .select("*")
      .eq("ref_code", parentRef)
      .single();

    if (parentErr || !parent) {
      return Response.json(
        { ok: false, error: "Parent share not found" },
        { status: 404 }
      );
    }

    // 새로운 share 생성 (hop = parent.hop + 1)
    const newHop = parent.hop + 1;
    const { data: inserted, error: insertErr } = await supabase
      .from("r3_shares")
      .insert({
        message_id: parent.message_id,
        parent_ref: parentRef,
        hop: newHop,
      })
      .select()
      .single();

    if (insertErr || !inserted) {
      return Response.json(
        { ok: false, error: "Insert failed" },
        { status: 500 }
      );
    }

    // baseUrl 가져오기 (환경변수 → fallback 순서)
    const baseUrl =
      process.env.R3_APP_BASE_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "https://r3-pre-mvp-full.vercel.app"; // final fallback

    const fullUrl = `${baseUrl}/r/${inserted.ref_code}`;

    return Response.json({
      ok: true,
      ref_code: inserted.ref_code,
      hop: newHop,
      url: fullUrl, // ★★★ 가장 중요한 부분 ★★★
    });
  } catch (e) {
    console.error("share-child error:", e);
    return Response.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
