// app/api/ogimage/route.ts
import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { supabaseServer } from "../../../lib/supabaseServer";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shareId = searchParams.get("shareId");

  if (!shareId) {
    return new Response("Missing shareId", { status: 400 });
  }

  const supabase = supabaseServer();

  // 1) 공유 레코드 가져오기 (hop 포함)
  const { data: share, error: shareError } = await supabase
    .from("r3_shares")
    .select("id, title, original_url, target_url, hop")
    .eq("ref_code", shareId)
    .maybeSingle();

  if (shareError || !share) {
    console.error("share fetch error:", shareError);
    return new Response("Share not found", { status: 404 });
  }

  // 2) 조회수(hits) 개수 세기
  const { count: hitsCount, error: hitsError } = await supabase
    .from("r3_hits")
    .select("*", { count: "exact", head: true })
    .eq("share_id", share.id);

  if (hitsError) {
    console.error("hits fetch error:", hitsError);
  }

  const views = hitsCount ?? 0;
  const hop = share.hop ?? 1;

  const targetUrl = share.target_url || share.original_url || "";
  let hostname = "";
  try {
    if (targetUrl) {
      hostname = new URL(targetUrl).hostname.replace(/^www\./, "");
    }
  } catch {
    // ignore
  }

  const title = share.title || "R3 Shared Link";

  const badgeStyle: React.CSSProperties = {
    padding: "10px 20px",
    borderRadius: 9999,
    fontSize: 28,
    fontWeight: 600,
    border: "2px solid rgba(148, 163, 184, 0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 72px",
          background:
            "radial-gradient(circle at top left, #0f172a, #020617 55%, #020617)",
          color: "#e5e7eb",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        {/* 상단 R3 로고 / 도메인 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 32,
            fontWeight: 700,
          }}
        >
          <span>R3</span>
          {hostname && (
            <span style={{ fontSize: 24, color: "#9ca3af" }}>{hostname}</span>
          )}
        </div>

        {/* 중앙 타이틀 */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 52,
              fontWeight: 700,
              lineHeight: 1.2,
              maxWidth: "1000px",
              whiteSpace: "pre-wrap",
            }}
          >
            {title}
          </div>
        </div>

        {/* 하단 배지 영역: 조회수 + HOP */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 24,
            alignItems: "center",
          }}
        >
          {/* 조회수 배지 */}
          <div style={badgeStyle}>
            <span style={{ marginRight: 8 }}>Views</span>
            <span>{views}</span>
          </div>

          {/* HOP 배지 */}
          <div style={badgeStyle}>
            <span style={{ marginRight: 8 }}>HOP</span>
            <span>{hop}</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
