// app/api/ogimage/route.ts
import { ImageResponse } from "next/og";
import { supabaseServer } from "../../../lib/supabaseServer";

export const runtime = "edge";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const shareId = searchParams.get("shareId");

    if (!shareId) {
      return new Response("Missing shareId", { status: 400 });
    }

    const supabase = supabaseServer();

    // 1) 해당 share 레코드 조회 (title, hop)
    const { data: share, error: shareErr } = await supabase
      .from("r3_shares")
      .select("id, hop, message_id")
      .eq("ref_code", shareId)
      .maybeSingle();

    if (shareErr || !share) {
      return new Response("Share not found", { status: 404 });
    }

    // 2) 원본 message에서 title 가져오기
    const { data: message, error: msgErr } = await supabase
      .from("r3_messages")
      .select("title")
      .eq("id", share.message_id)
      .maybeSingle();

    const title = message?.title ?? "R3 Shared Content";

    // 3) 조회수(hits) 가져오기
    const { data: hitRow } = await supabase
      .from("r3_hits")
      .select("total")
      .eq("share_id", share.id)
      .maybeSingle();

    const hits = hitRow?.total ?? 0;

    // 4) 제목 자동 줄바꿈 (최대 18자 단위)
    function wrapText(str: string, max = 18): string[] {
      const out = [];
      let buf = "";
      for (const ch of str) {
        buf += ch;
        if (buf.length >= max) {
          out.push(buf);
          buf = "";
        }
      }
      if (buf.length > 0) out.push(buf);
      return out;
    }

    const wrappedTitle = wrapText(title);

    // 5) 배경색, hit/hop 위치 고정
    return new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            background: "#f3f3f3",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "60px",
            fontFamily: "R3Font",
          }}
        >
          <div
            style={{
              fontSize: "56px",
              fontWeight: 600,
              lineHeight: 1.25,
              marginBottom: "40px",
              whiteSpace: "pre-wrap",
            }}
          >
            {wrappedTitle.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>

          {/* hit/hop badge 영역 */}
          <div style={{ display: "flex", gap: "24px" }}>
            <div
              style={{
                fontSize: "44px",
                background: "#222",
                color: "white",
                padding: "12px 28px",
                borderRadius: "14px",
              }}
            >
              🔥 Hits: {hits}
            </div>

            <div
              style={{
                fontSize: "44px",
                background: "#444",
                color: "white",
                padding: "12px 28px",
                borderRadius: "14px",
              }}
            >
              🌀 Hop: {share.hop}
            </div>
          </div>

          {/* R3 Footer */}
          <div
            style={{
              position: "absolute",
              bottom: "40px",
              right: "50px",
              fontSize: "30px",
              color: "#666",
            }}
          >
            r3-pre-mvp
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          // 캐시 방지
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (err) {
    console.error(err);
    return new Response("OG error", { status: 500 });
  }
}
