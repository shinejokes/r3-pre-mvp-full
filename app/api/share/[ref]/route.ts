// app/api/share/[ref]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";

export async function GET(req: NextRequest) {
  // 🔹 요청 URL에서 직접 refCode 뽑기: /api/share/RCgm2oo → "RCgm2oo"
  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const refCode = segments[segments.length - 1];

  if (!refCode) {
    return NextResponse.json(
      { error: "refCode is required" },
      { status: 400 }
    );
  }

  const supabase = supabaseServer();

  const { data: share, error } = await supabase
    .from("r3_shares")
    .select("*")
    .eq("ref_code", refCode)
    .maybeSingle();

  if (error) {
    console.error("share fetch error:", error);
    return NextResponse.json(
      { error: "DB error", detail: error },
      { status: 500 }
    );
  }

  if (!share) {
    return NextResponse.json(
      { error: "not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ share });
}
