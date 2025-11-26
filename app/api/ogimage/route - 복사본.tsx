// app/api/ogimage/route.ts
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shareId = searchParams.get("shareId");

    if (!shareId) {
      return new Response("Missing shareId", { status: 400 });
    }

    const supabase = supabaseServer();

    // 1) ref_code(=shareId)로 share + message_id 가져오기 ✅
    const { data: share, error: shareError } = await supabase
      .from("r3_shares")
      .select("id, message_id, title, author, target_url")
      .eq("ref_code", shareId)
      .single();

    if (shareError || !share) {
      console.error("Share not found", shareError);
      return new Response("Share not found", { status: 404 });
    }

    // 2) message_id가 없으면 fallback: share 기준으로 count (혹시 모를 옛 데이터용) ✅
    let views = 0;

    if (share.message_id) {
      // (A) 원본 메시지 전체 조회수: message_id 기준 COUNT ✅
      const { count, error: hitsError } = await supabase
        .from("r3_hits")
        .select("id", { count: "exact", head: true })
        .eq("message_id", share.message_id);

      if (hitsError) {
        console.error("Error counting hits by message_id", hitsError);
      }

      views = count ?? 0;
    } else {
      // (B) 옛 구조: ref_code 또는 share_id 기준으로라도 count
      const { count, error: hitsError } = await supabase
        .from("r3_hits")
        .select("id", { count: "exact", head: true })
        .eq("share_id", share.id);

      if (hitsError) {
        console.error("Error counting hits by share_id", hitsError);
      }

      views = count ?? 0;
    }

    // 3) 이제 views는 "이 원본 메시지 전체를 본 횟수" (스냅샷) ✅
    const title = share.title ?? "R3 Message";
    const author = share.author ?? "";
    const viewsText = `Views ${views}`;

    // 4) 실제 OG 이미지 렌더링
    return new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "48px",
            boxSizing: "border-box",
            backgroundColor: "#111",
            color: "#fff",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div style={{ fontSize: 40, fontWeight: 700, lineHeight: 1.3 }}>
            {title}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              fontSize: 24,
            }}
          >
            <div>{author}</div>
            <div
              style={{
                padding: "8px 16px",
                borderRadius: "999px",
                border: "2px solid #fff",
                fontWeight: 700,
              }}
            >
              {viewsText} {/* 🔥 여기의 views가 이제 원본 기준 누적 */}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    console.error(e);
    return new Response("Error generating image", { status: 500 });
  }
}
