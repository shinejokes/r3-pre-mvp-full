// app/api/share/[ref]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";

type RouteParams = {
  params: { ref: string };
};

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const refCode = params.ref;

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
