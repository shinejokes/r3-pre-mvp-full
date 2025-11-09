// app/api/ogimage/route.tsx
import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { supabaseServer } from "../../../lib/supabaseServer";

export const runtime = "edge";
export const dynamic = "force-dynamic"; // 캐시로 인한 빈 응답 방지

function getHost(req: NextRequest) {
  return req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
}
function getBaseUrl(req: NextRequest) {
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  return `${proto}://${getHost(req)}`;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const ref = (url.searchParams.get("shareId") || "").trim();
  const dbg = url.searchParams.get("debug");

  // ---- DEBUG: 폰트 없이도 100% 보이는 컬러 박스 ----
  if (dbg === "1") {
    return new ImageResponse(
      (
        <div
          style={{
            width: 1200,
            height: 630,
            background: "linear-gradient(135deg, #222 0%, #555 50%, #999 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* 글자 없음! 박스만 */}
          <div style={{ width: 800, height: 300, background: "#ffd54f", borderRadius: 32 }} />
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  try {
    const supabase = supabaseServer();
    const baseUrl = getBaseUrl(req);

    if (!ref) {
      // ref 없으면 역시 박스만
      return new ImageResponse(
        <div style={{ width: 1200, height: 630, background: "#e0e0e0" }} />,
        { width: 1200, height: 630, headers: { "Cache-Control": "no-store" } }
      );
    }

    // 1) ref_code -> share.id
    const { data: share } = await supabase
      .from("r3_shares")
      .select("id, ref_code, message_id")
      .eq("ref_code", ref)
      .maybeSingle();

    if (!share) {
      // 못 찾으면 회색 박스
      return new ImageResponse(
        <div style={{ width: 1200, height: 630, background: "#cfd8dc" }} />,
        { width: 1200, height: 630, headers: { "Cache-Control": "no-store" } }
      );
    }

    // 2) hits 카운트 (share_id 스키마)
    const { count } = await supabase
      .from("r3_hits")
      .select("*", { count: "exact", head: true })
      .eq("share_id", share.id);

    // 3) 정상 카드 (텍스트 최소화: 단일 숫자만 — 폰트 의존 낮춤)
    const views = count ?? 0;
    return new ImageResponse(
      (
        <div
          style={{
            width: 1200,
            height: 630,
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* 텍스트를 아주 작게만 사용 (폰트 문제 회피), 보조로 큰 박스 */}
          <div
            style={{
              width: 1000,
              height: 500,
              borderRadius: 40,
              background: "#f5f5f5",
              border: "6px solid #222",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 600,
                height: 220,
                background: "#90caf9",
                borderRadius: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 64 }}>{String(views)}</span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (e) {
    // 치명적 오류 시에도 컬러 박스 반환
    return new ImageResponse(
      <div style={{ width: 1200, height: 630, background: "#ef9a9a" }} />,
      { width: 1200, height: 630, headers: { "Cache-Control": "no-store" } }
    );
  }
}
