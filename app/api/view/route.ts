import { NextRequest } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const ref_code = body?.ref_code as string | undefined;

    if (!ref_code) {
      return new Response("ref_code is required", { status: 400 });
    }

    const supabase = supabaseServer();

    // 현재 views 값 읽기
    const { data, error } = await supabase
      .from("r3_shares")
      .select("views")
      .eq("ref_code", ref_code)
      .maybeSingle();

    if (error) {
      console.error("Supabase select error", error);
      return new Response("DB select error", { status: 500 });
    }

    const currentViews = data?.views ?? 0;

    // views = views + 1 로 업데이트 (데모라 경쟁조건은 무시)
    const { error: updateError } = await supabase
      .from("r3_shares")
      .update({ views: currentViews + 1 })
      .eq("ref_code", ref_code);

    if (updateError) {
      console.error("Supabase update error", updateError);
      return new Response("DB update error", { status: 500 });
    }

    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error("Unexpected error", e);
    return new Response("Unexpected error", { status: 500 });
  }
}
