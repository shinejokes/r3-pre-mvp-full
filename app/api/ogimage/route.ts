// app/api/ogimage/route.ts
import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { supabaseServer } from "../../../lib/supabaseServer";

export const runtime = "edge";

function getBaseUrl(req: NextRequest) {
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host =
    req.headers.get("x-forwarded-host") ??
    req.headers.get("host") ??
    "localhost:3000";
  return `${proto}://${host}`;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const ref = (url.searchParams.get("shareId") || "").trim();
  const baseUrl = getBaseUrl(req);
  const supabase = supabaseServer();

  if (!ref) {
    return makeImage("R3 pre-MVP", "No shareId", "-", 0, baseUrl);
  }

  // ref_code → share.id 조회
  const { data: share } = await supabase
    .from("r3_shares")
    .select("id, ref_code, message_id")
    .eq("ref_code", ref)
    .maybeSingle();

  if (!share) {
    return makeImage("R3 pre-MVP", "Share not found", ref, 0, baseUrl);
  }

  // 메시지 타이틀, url, description
  const { data: msg } = await supabase
    .from("r3_messages")
    .select("title, url, origin_url, description")
    .eq("id", (share.message_id ?? "").toString().trim())
    .maybeSingle();

  const title = msg?.title ?? "R3 pre-MVP";
  const subtitle = msg?.description ?? msg?.url ?? msg?.origin_url ?? baseUrl;

  // hits 카운트
  const { count } = await supabase
    .from("r3_hits")
    .select("*", { count: "exact", head: true })
    .eq("share_id", share.id);

  const views = count ?? 0;
  return makeImage(title, subtitle, ref, views, baseUrl);
}

// ---------- 이미지 렌더러 ----------
function makeImage(
  title: string,
  subtitle: string,
  shareId: string,
  views: number,
  host: string
) {
  return new ImageResponse(
    {
      type: "div",
      props: {
        style: {
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
          color: "#111",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                fontSize: 84,
                fontWeight: 700,
                marginBottom: 16,
                textAlign: "center",
              },
              children: truncate(title, 38),
            },
          },
          {
            type: "div",
            props: {
              style: {
                fontSize: 44,
                opacity: 0.9,
                marginBottom: 40,
                textAlign: "center",
              },
              children: truncate(subtitle, 48),
            },
          },
          {
            type: "div",
            props: {
              style: { fontSize: 40, marginBottom: 8 },
              children: [
                { type: "span", props: { style: { opacity: 0.6 }, children: "Share ID:" } },
                " ",
                shareId,
              ],
            },
          },
          {
            type: "div",
            props: {
              style: { fontSize: 40, marginBottom: 32 },
              children: [
                { type: "span", props: { style: { opacity: 0.6 }, children: "Views:" } },
                " ",
                String(views),
              ],
            },
          },
          {
            type: "div",
            props: {
              style: { fontSize: 36, opacity: 0.45 },
              children: host,
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=60",
      },
    }
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
