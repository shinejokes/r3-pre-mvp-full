// app/api/ogimage/route.tsx
import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { supabaseServer } from "../../../lib/supabaseServer";

export const runtime = "edge"; // 빠른 실행

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
    const ref = (url.searchParams.get("shareId") || "").trim();
    const baseUrl = getBaseUrl(req);
    const host = getHost(req);
    const supabase = supabaseServer();

    if (!ref) {
      return makeImage({ title: "R3 pre-MVP", subtitle: "No shareId", shareId: "-", views: 0, host });
    }

    // 1) ref_code → share.id
    const { data: share } = await supabase
      .from("r3_shares")
      .select("id, ref_code, message_id")
      .eq("ref_code", ref)
      .maybeSingle();

    if (!share) {
      return makeImage({ title: "R3 pre-MVP", subtitle: "Share not found", shareId: ref, views: 0, host });
    }

    // 2) 메시지(타이틀/URL/설명)
    const { data: msg } = await supabase
      .from("r3_messages")
      .select("title, url, origin_url, description")
      .eq("id", (share.message_id ?? "").toString().trim())
      .maybeSingle();

    const title = msg?.title ?? "R3 pre-MVP";
    const subtitle = msg?.description ?? msg?.url ?? msg?.origin_url ?? baseUrl;

    // 3) hits 카운트 (스키마: r3_hits.share_id TEXT)
    const { count } = await supabase
      .from("r3_hits")
      .select("*", { count: "exact", head: true })
      .eq("share_id", share.id);

    const views = count ?? 0;

    return makeImage({ title, subtitle, shareId: ref, views, host });
  } catch (e) {
    // 에러 시에도 이미지 반환(문구만 바뀜)
    return makeImage({ title: "R3 pre-MVP", subtitle: "OG image error", shareId: "-", views: 0, host: "r3" });
  }
}

function makeImage(opts: { title: string; subtitle: string; shareId: string; views: number; host: string }) {
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
          backgroundColor: "#fff",
          color: "#111",
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
        "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=30",
      },
    }
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
