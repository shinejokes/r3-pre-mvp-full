// app/api/ogimage/route.ts
import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { supabaseServer } from "../../../lib/supabaseServer";

export const runtime = "nodejs"; // edge가 아니라 Node.js 런타임 사용

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shareId = searchParams.get("shareId") || "NO_PARAM";

  const supabase = supabaseServer();

  // 1) 이 ref_code에 해당하는 share 레코드 찾기
  const { data: share, error: shareError } = await supabase
    .from("r3_shares")
    .select("id, title, original_url, target_url")
    .eq("ref_code", shareId)
    .maybeSingle();

  if (shareError) {
    console.error("ogimage shareError:", shareError);
  }

  // 2) 조회수 세기 (r3_hits에서 share_id 기준으로 count)
  let views = 0;
  if (share?.id) {
    const { count, error: hitsError } = await supabase
      .from("r3_hits")
      .select("*", { count: "exact", head: true })
      .eq("share_id", share.id);

    if (hitsError) {
      console.error("ogimage hitsError:", hitsError);
    } else if (typeof count === "number") {
      views = count;
    }
  }

  // 3) 표시용 텍스트 구성
  const baseTitle = `R3 v12 • ${shareId}`;
  const titleText = share?.title ? `${share.title}` : "";
  const urlForDisplay =
    share?.target_url || share?.original_url || "";

  let urlHost = "";
  try {
    if (urlForDisplay) {
      urlHost = new URL(urlForDisplay).hostname.replace(/^www\./, "");
    }
  } catch {
    // 잘못된 URL이면 그냥 무시
  }

  const viewsText = `조회수: ${views.toLocaleString("ko-KR")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: size.width,
          height: size.height,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "white",
          padding: 80,
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            marginBottom: 24,
          }}
        >
          {baseTitle}
        </div>

        <div
          style={{
            fontSize: 28,
            marginBottom: 16,
          }}
        >
          {viewsText}
        </div>

        {titleText && (
          <div
            style={{
              fontSize: 26,
              marginTop: 8,
              textAlign: "center",
              maxWidth: 900,
              lineHeight: 1.3,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {titleText}
          </div>
        )}

        {urlHost && (
          <div
            style={{
              fontSize: 22,
              marginTop: 12,
              color: "#4b5563",
            }}
          >
            {urlHost}
          </div>
        )}
      </div>
    ),
    {
      ...size,
    }
  );
}
