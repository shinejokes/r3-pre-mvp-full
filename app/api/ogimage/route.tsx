import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

export const runtime = "edge";
export const dynamic = "force-dynamic";

function render(text: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#ffeb3b",
          color: "#000",
          fontSize: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        {text}
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "no-store" } }
  );
}

export async function GET(req: NextRequest) {
  const ref = (new URL(req.url).searchParams.get("shareId") || "").trim();
  if (!ref) return render("No shareId");

  try {
    const supabase = supabaseServer();
    const { data: share, error } = await supabase
      .from("r3_shares")
      .select("id, ref_code, message_id")
      .eq("ref_code", ref)
      .maybeSingle();

    if (error) return render("Query error");
    if (!share) return render("Share not found");

    return render(`share.id = ${share.id}`);
  } catch (err) {
    return render("Supabase error");
  }
}
