// app/r/[ref]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

/** 절대 URL 생성 (Vercel/프록시 대응) */
function getBaseUrl(req: NextRequest) {
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host =
    req.headers.get("x-forwarded-host") ??
    req.headers.get("host") ??
    "localhost:3000";
  return `${proto}://${host}`;
}

/** 미리보기 스크래퍼(봇) 판단 */
function isPreviewBot(ua: string) {
  return /(Kakao|facebookexternalhit|Facebot|Twitterbot|Slackbot|Discordbot|LinkedInBot|TelegramBot|WhatsApp|Google-Structured-Data)/i.test(
    ua
  );
}

/** 간단한 HTML escape */
function escapeHtml(str: string) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/** 클라이언트 IP 추출(로그 용) */
function getClientIp(req: NextRequest) {
  const h = req.headers.get("x-forwarded-for");
  if (!h) return null;
  return h.split(",")[0]?.trim() ?? null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { ref: string } }
) {
  const { ref } = params;
  const ua = req.headers.get("user-agent") || "";
  const baseUrl = getBaseUrl(req);
  const supabase = supabaseServer();

  // ---------- 1) ref_code로 share 찾기 ----------
  const { data: share, error: shareErr } = await supabase
    .from("r3_shares")
    .select("id, ref_code, message_id, created_at")
    .eq("ref_code", ref)
    .single();

  if (shareErr || !share) {
    console.error("[/r/:ref] share lookup failed", { ref, shareErr });
    return new NextResponse("Share not found", { status: 404 });
  }

  // ---------- 2) message_id로 message 찾기 ----------
  const { data: msg, error: msgErr } = await supabase
    .from("r3_messages")
    .select("id, title, url, description")
    .eq("id", share.message_id)
    .single();

  if (msgErr || !msg) {
    console.error("[/r/:ref] message lookup failed", {
      message_id: share.message_id,
      msgErr,
    });
    return new NextResponse("Message not found", { status: 404 });
  }

  const title = msg.title ?? "R3 Share";
  const targetUrl = msg.url ?? baseUrl; // 방어
  const desc = msg.description ?? "공유된 콘텐츠";
  const ogImage = `${baseUrl}/api/ogimage?shareId=${encodeURIComponent(ref)}`;

  // ---------- 3) 미리보기 봇이면 OG 메타 HTML 반환 ----------
  if (isPreviewBot(ua)) {
    const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>

    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(desc)}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:image:secure_url" content="${ogImage}" />
    <meta property="og:url" content="${baseUrl}/r/${encodeURIComponent(ref)}" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(desc)}" />
    <meta name="twitter:image" content="${ogImage}" />

    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <p>Preview page for bots.</p>
  </body>
</html>`;
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=120, s-maxage=120",
      },
    });
  }

  // ---------- 4) 일반 사용자면 hits 기록 후 원본으로 리다이렉트 ----------
  try {
    await supabase.from("r3_hits").insert({
      share_ref_code: ref,
      user_agent: ua.slice(0, 500),
      referer: req.headers.get("referer")?.slice(0, 500) ?? null,
      ip_hash: getClientIp(req),
    });
  } catch (e) {
    console.error("[/r/:ref] hits insert failed", { ref, error: e });
    // 기록 실패해도 사용자 경험을 막진 않음
  }

  return NextResponse.redirect(targetUrl, { status: 302 });
}
