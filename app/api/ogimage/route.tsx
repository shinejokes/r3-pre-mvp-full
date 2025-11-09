// app/api/ogimage/route.tsx
import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { supabaseServer } from "../../../lib/supabaseServer";

export const runtime = "edge";
export const dynamic = "force-dynamic"; // 캐시로 인한 빈 응답 회피

function getHost(req: NextRequest) {
  return req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

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
          background: "linear-gradient(135deg, #ffffff, #f5f5f5)",
          color: "#111",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
        }}
      >
        <div style={{ fontSize: 78, fontWeight: 800, marginBottom: 18, textAlign: "center" }}>
          {truncate(title, 28)}
        </div>

        <div style={{ fontSize: 42, opacity: 0.9, marginBottom: 32, textAlign: "center" }}>
          {truncate(subtitle, 46)}
        </div>

        <div style={{ fontSize: 44, marginBottom: 8 }}>
          <span style={{ opacity: 0.6 }}>Share ID:</span>&nbsp;
          <span style={{ color: "#d32f2f" }}>{shareId}</span>
        </div>

        <div style={{ fontSize: 44, marginBottom: 28 }}>
          <span style={{ opacity: 0.6 }}>Views:</span>&nbsp;
          <span style={{ color: "#1976d2" }}>{String(views)}</span>
        </div>

        <div style={{ fontSize: 32, opacity: 0.5 }}>{host}</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { "Cache-Control": "no-store" },
    }
  );
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const ref = (url.searchParams.get("shareId") || "").trim();
  const debug = url.searchParams.get("debug") === "1";
  const host = getHost(req);

  // 디버그 모드: 데이터베이스 건너뛰고 즉시 카드 렌더
  if (debug) {
    return renderCard({
      title: "R3 DEBUG MODE",
      subtitle: "This is a visible test card",
      shareId: ref || "-",
      views: 123,
      host,
    });
  }

  try {
    if (!ref) {
      return renderCard({
        title: "R3 pre-MVP",
        subtitle: "No shareId",
        shareId: "-",
        views: 0,
        host,
      });
    }

    const supabase = supabaseServer();

    // 1) ref_code -> share 조회
    const { data: share, error: sErr } = await supabase
      .from("r3_shares")
      .select("id, ref_code, message_id")
      .eq("ref_code", ref)
      .maybeSingle();

    if (sErr || !share) {
      return renderCard({
        title: "R3 pre-MVP",
        subtitle: "Share not found",
        shareId: ref,
        views: 0,
        host,
      });
    }

    // 2) message 조회 (title/description/url/origin_url)
    const mid = (share.message_id ?? "").toString().trim();
    const { data: msg } = await supabase
      .from("r3_messages")
      .select("title, description, url, origin_url")
      .eq("id", mid)
      .maybeSingle();

    const title = msg?.title ?? "R3 pre-MVP";
    const subtitle = msg?.description ?? msg?.url ?? msg?.origin_url ?? host;

    // 3) hits 카운트 (스키마: r3_hits.share_id TEXT)
    const { count } = await supabase
      .from("r3_hits")
      .select("*", { count: "exact", head: true })
      .eq("share_id", share.id);

    const views = count ?? 0;

    // 4) 카드 렌더
    return renderCard({
      title,
      subtitle,
      shareId: ref,
      views,
      host,
    });
  } catch {
    return renderCard({
      title: "R3 pre-MVP",
      subtitle: "OG image error",
      shareId: "-",
      views: 0,
      host,
    });
  }
}
