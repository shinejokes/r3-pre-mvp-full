// app/api/ogimage/route.tsx
import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { supabaseServer } from "../../../lib/supabaseServer";

export const runtime = "edge";            // Vercel Edge
export const dynamic = "force-dynamic";   // 캐시로 인한 빈 응답 방지

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
  const url = new URL(req.url);
  const ref = (url.searchParams.get("shareId") || "").trim();
  const debug = url.searchParams.get("debug") === "1";
  const baseUrl = getBaseUrl(req);

  // 🔹 0) 디버그 모드: Supabase 안 거치고 즉시 카드 그리기
  if (debug) {
    return renderCard({
      title: "R3 pre-MVP",
      subtitle: "DEBUG MODE",
      shareId: ref || "-",
      views: 123,
      host: getHost(req),
    });
  }

  try {
    const supabase = supabaseServer();

    if (!ref) {
      return renderCard({
        title: "R3 pre-MVP",
        subtitle: "No shareId",
        shareId: "-",
        views: 0,
        host: getHost(req),
      });
    }

    // 1) ref_code -> share.id
    const { data: share, error: sErr } = await supabase
      .from("r3_shares")
      .select("id, ref_code, message_id")
      .eq("ref_code", ref)
      .maybeSingle();

    if (sErr) console.error("[ogimage] share query error:", String(sErr));
    if (!share) {
      return renderCard({
        title: "R3 pre-MVP",
        subtitle: "Share not found",
        shareId: ref,
        views: 0,
        host: getHost(req),
      });
    }

    // 2) 메시지(타이틀/URL/설명)
    const mid = (share.message_id ?? "").toString().trim();
    const { data: msg, error: mErr } = await supabase
      .from("r3_messages")
      .select("title, url, origin_url, description")
      .eq("id", mid)
      .maybeSingle();

    if (mErr) console.error("[ogimage] message query error:", String(mErr));

    const title = msg?.title ?? "R3 pre-MVP";
    const subtitle = msg?.description ?? msg?.url ?? msg?.origin_url ?? baseUrl;

    // 3) hits 카운트 (스키마: r3_hits.share_id TEXT)
    const { count, error: cErr } = await supabase
      .from("r3_hits")
      .select("*", { count: "exact", head: true })
      .eq("share_id", share.id);

    if (cErr) console.error("[ogimage] count error:", String(cErr));

    const views = count ?? 0;

    return renderCard({
      title,
      subtitle,
      shareId: ref,
      views,
      host: getHost(req),
    });
  } catch (e) {
    console.error("[ogimage] fatal error:", String(e));
    // 그래도 항상 이미지 반환
    return renderCard({
      title: "R3 pre-MVP",
      subtitle: "OG image error",
      shareId: "-",
      views: 0,
      host: "r3",
    });
  }
}

/** JSX 기반 카드 렌더링 */
function renderCard(opts: {
  title: string;
  subtitle: string;
  shareId: string;
  views: number;
  host: string;
}) {
  const { title, subtitle, shareId, views, host } = opts;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#ffffff",
          color: "#111111",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
        }}
      >
        <div style={{ fontSize: 84, fontWeight: 700, marginBottom: 16, textAlign: "center" }}>
          {truncate(title, 38)}
        </div>
        <div style={{ fontSize: 44, opacity: 0.9, marginBottom: 40, textAlign: "center" }}>
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
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        // 캐시 지연 때문에 빈 화면 보이는 증상 방지
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
