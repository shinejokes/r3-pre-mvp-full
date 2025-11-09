// app/api/ogimage/route.tsx
import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { supabaseServer } from "../../../lib/supabaseServer";

export const runtime = "edge";
export const dynamic = "force-dynamic"; // 캐시로 인한 빈응답 방지

function getHost(req: NextRequest) {
  return req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const ref = (url.searchParams.get("shareId") || "").trim();
  const debug = url.searchParams.get("debug") === "1";

  // 디버그: 텍스트도 SVG로 출력
  if (debug) {
    return new ImageResponse(
      (
        <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
          <rect width="1200" height="630" fill="#ffffff" />
          <rect x="140" y="120" width="920" height="390" rx="28" fill="#ffd54f" stroke="#111" strokeWidth="6" />
          <text x="600" y="230" textAnchor="middle" fontSize="64" fill="#111">R3 DEBUG MODE</text>
          <text x="600" y="320" textAnchor="middle" fontSize="42" fill="#333">shareId = {ref || "-"}</text>
          <text x="600" y="420" textAnchor="middle" fontSize="42" fill="#333">{getHost(req)}</text>
        </svg>
      ),
      { width: 1200, height: 630, headers: { "Cache-Control": "no-store" } }
    );
  }

  const supabase = supabaseServer();

  if (!ref) {
    return grey("No shareId");
  }

  // 1) ref_code -> share.id
  const { data: share } = await supabase
    .from("r3_shares")
    .select("id, ref_code, message_id")
    .eq("ref_code", ref)
    .maybeSingle();

  if (!share) return grey("Share not found");

  // 2) message(타이틀/설명/URL)
  const mid = (share.message_id ?? "").toString().trim();
  const { data: msg } = await supabase
    .from("r3_messages")
    .select("title, description, url, origin_url")
    .eq("id", mid)
    .maybeSingle();

  const title = msg?.title ?? "R3 pre-MVP";
  const subtitle = msg?.description ?? msg?.url ?? msg?.origin_url ?? getHost(req);

  // 3) hits 카운트 (스키마: r3_hits.share_id TEXT)
  const { count } = await supabase
    .from("r3_hits")
    .select("*", { count: "exact", head: true })
    .eq("share_id", share.id);

  const views = count ?? 0;

  // 4) SVG 카드 생성 (텍스트도 SVG <text>)
  return new ImageResponse(
    (
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#f5f5f5" />
          </linearGradient>
        </defs>
        <rect width="1200" height="630" fill="url(#bg)" />
        <rect x="80" y="80" width="1040" height="470" rx="36" fill="#fafafa" stroke="#111" strokeWidth="6" />
        <text x="600" y="200" textAnchor="middle" fontSize="72" fill="#111">{truncate(title, 28)}</text>
        <text x="600" y="280" textAnchor="middle" fontSize="40" fill="#333">{truncate(subtitle, 46)}</text>

        <text x="420" y="380" textAnchor="end" fontSize="44" fill="#666">Share ID:</text>
        <text x="440" y="380" textAnchor="start" fontSize="44" fill="#111">{ref}</text>

        <text x="420" y="450" textAnchor="end" fontSize="44" fill="#666">Views:</text>
        <text x="440" y="450" textAnchor="start" fontSize="64" fill="#111">{String(views)}</text>

        <text x="600" y="560" textAnchor="middle" fontSize="36" fill="#888">{getHost(req)}</text>
      </svg>
    ),
    {
      width: 1200,
      height: 630,
      headers: { "Cache-Control": "no-store" },
    }
  );
}

function grey(msg: string) {
return new ImageResponse(
  (
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #ffffff, #f5f5f5)",
        color: "#111",
        fontSize: 64,
        fontWeight: "bold",
      }}
    >
      <div style={{ fontSize: 72, marginBottom: 20 }}>{truncate(title, 28)}</div>
      <div style={{ fontSize: 40, marginBottom: 20, color: "#333" }}>{truncate(subtitle, 46)}</div>
      <div style={{ fontSize: 44 }}>
        Share ID: <span style={{ color: "#d32f2f" }}>{ref}</span>
      </div>
      <div style={{ fontSize: 44, marginTop: 10 }}>
        Views: <span style={{ color: "#1976d2" }}>{String(views)}</span>
      </div>
      <div style={{ fontSize: 28, marginTop: 40, color: "#888" }}>{getHost(req)}</div>
    </div>
  ),
  {
    width: 1200,
    height: 630,
    headers: { "Cache-Control": "no-store" },
  }
);

}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
