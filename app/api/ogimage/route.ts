// app/api/ogimage/route.ts
import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { supabaseServer } from "../../../lib/supabaseServer";

export const runtime = "edge"; // @vercel/og 권장 (빠르고 폰트 의존 적음)

function getHost(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-host") ??
    req.headers.get("host") ??
    "localhost:3000"
  );
}

function getBaseUrl(req: NextRequest) {
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  return `${proto}://${getHost(req)}`;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const ref = (url.searchParams.get("shareId") || "").trim(); // 문자열 ref_code
    const baseUrl = getBaseUrl(req);
    const host = getHost(req);

    if (!ref) {
      return new ImageResponse(renderCard({
        title: "R3 pre-MVP",
        subtitle: "No shareId",
        shareId: "-",
        views: 0,
        host,
      }), {
        headers: { "Cache-Control": "public, max-age=30, s-maxage=30" },
      });
    }

    const supabase = supabaseServer();

    // 1) ref_code -> share.id 조회
    const { data: share } = await supabase
      .from("r3_shares")
      .select("id, ref_code, message_id")
      .eq("ref_code", ref)
      .maybeSingle();

    if (!share) {
      return new ImageResponse(renderCard({
        title: "R3 pre-MVP",
        subtitle: "Share not found",
        shareId: ref,
        views: 0,
        host,
      }), {
        headers: { "Cache-Control": "public, max-age=30, s-maxage=30" },
      });
    }

    // 2) message 타이틀 가져오기 (origin_url도 허용)
    const { data: msg } = await supabase
      .from("r3_messages")
      .select("title, url, origin_url, description")
      .eq("id", (share.message_id ?? "").toString().trim())
      .maybeSingle();

    const title = msg?.title ?? "R3 pre-MVP";
    const subtitle = msg?.description ?? (msg?.url ?? msg?.origin_url ?? baseUrl);

    // 3) share.id 기준으로 hits 카운트 (스키마: r3_hits.share_id TEXT)
    const { count } = await supabase
      .from("r3_hits")
      .select("*", { count: "exact", head: true })
      .eq("share_id", share.id);

    const views = count ?? 0;

    return new ImageResponse(
      renderCard({
        title,
        subtitle,
        shareId: ref,
        views,
        host,
      }),
      {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=30",
        },
      }
    );
  } catch (e: any) {
    // 폴백 이미지 (예상치 못한 오류)
    return new ImageResponse(renderCard({
      title: "R3 pre-MVP",
      subtitle: "OG image error",
      shareId: "-",
      views: 0,
      host: "r3",
    }), {
      headers: { "Cache-Control": "public, max-age=30, s-maxage=30" },
    });
  }
}

/** 카드 렌더러: 시스템 기본 폰트만 사용 (fontconfig 경고 무시 가능) */
function renderCard(opts: {
  title: string;
  subtitle: string;
  shareId: string;
  views: number;
  host: string;
}) {
  const { title, subtitle, shareId, views, host } = opts;
  return (
    <div
      style={{
        width: 1200,
        height: 630,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "#fff",
        color: "#111",
        fontFamily:
          // 시스템 폰트 우선 사용 — Vercel에서 fontconfig 경고가 떠도 동작에는 문제 없음
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
      }}
    >
      <div style={{ fontSize: 84, fontWeight: 700, marginBottom: 16 }}>
        {truncate(title, 38)}
      </div>
      <div style={{ fontSize: 44, opacity: 0.9, marginBottom: 40 }}>
        {truncate(subtitle, 48)}
      </div>

      <div style={{ fontSize: 40, marginBottom: 8 }}>
        <span style={{ opacity: 0.6 }}>Share ID:</span>&nbsp;{shareId}
      </div>
      <div style={{ fontSize: 40, marginBottom: 32 }}>
        <span style={{ opacity: 0.6 }}>Views:</span>&nbsp;{views}
      </div>

      <div style={{ fontSize: 36, opacity: 0.45 }}>{host}</div>
    </div>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
