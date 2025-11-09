// app/api/ogimage/route.tsx
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

export const runtime = "edge";
export const dynamic = "force-dynamic";

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const ref = (url.searchParams.get("shareId") || "").trim();
  const host =
    req.headers.get("x-forwarded-host") ??
    req.headers.get("host") ??
    "localhost:3000";

  const supabase = supabaseServer();

  if (!ref) {
    return renderSVG("R3 pre-MVP", "No shareId", "-", 0, host);
  }

  // 1) share
  const { data: share } = await supabase
    .from("r3_shares")
    .select("id, message_id")
    .eq("ref_code", ref)
    .maybeSingle();

  if (!share) {
    return renderSVG("R3 pre-MVP", "Share not found", ref, 0, host);
  }

  // 2) message
  const { data: msg } = await supabase
    .from("r3_messages")
    .select("title, description, url, origin_url")
    .eq("id", share.message_id)
    .maybeSingle();

  const title = msg?.title ?? "R3 pre-MVP";
  const subtitle =
    msg?.description ?? msg?.url ?? msg?.origin_url ?? host;

  // 3) hits
  const { count } = await supabase
    .from("r3_hits")
    .select("*", { count: "exact", head: true })
    .eq("share_id", share.id);

  const views = count ?? 0;

  // 4) Render SVG image
  return renderSVG(title, subtitle, ref, views, host);
}

function renderSVG(
  title: string,
  subtitle: string,
  ref: string,
  views: number,
  host: string
) {
  return new ImageResponse(
    (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="1200"
        height="630"
        style={{ fontFamily: "sans-serif" }}
      >
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f5f5f5" />
          </linearGradient>
        </defs>
        <rect width="1200" height="630" fill="url(#bg)" />
        <text
          x="600"
          y="200"
          textAnchor="middle"
          fontSize="64"
          fontWeight="700"
          fill="#111"
        >
          {truncate(title, 28)}
        </text>
        <text
          x="600"
          y="280"
          textAnchor="middle"
          fontSize="42"
          fill="#333"
        >
          {truncate(subtitle, 46)}
        </text>
        <text
          x="600"
          y="400"
          textAnchor="middle"
          fontSize="44"
          fill="#666"
        >
          Share ID: {ref}
        </text>
        <text
          x="600"
          y="460"
          textAnchor="middle"
          fontSize="44"
          fill="#111"
        >
          Views: {views}
        </text>
        <text
          x="600"
          y="560"
          textAnchor="middle"
          fontSize="30"
          fill="#999"
        >
          {host}
        </text>
      </svg>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "no-store" } }
  );
}
