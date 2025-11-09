// app/r/[ref]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

/** 절대 URL 생성 (프록시/Vercel 대응) */
function getBaseUrl(req: NextRequest) {
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host =
    req.headers.get("x-forwarded-host") ??
    req.headers.get("host") ??
    "localhost:3000";
  return `${proto}://${host}`;
}

/** 주요 미리보기 스크래퍼 UA 식별 */
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

/** 클라이언트 IP (프록시 헤더 기준) */
function getClientIp(req: NextRequest) {
  const h = req.headers.get("x-forwarded-for");
  if (!h) return null;
  return h.split(",")[0]?.trim() ?? null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { ref: string } }
) {
  const rawRef = params.ref ?? "";
  const ref = decodeURIComponent(rawRef).trim();
  const ua = req.headers.get("user-agent") || "";
  const baseUrl = getBaseUrl(req);
  const supabase = supabaseServer();

  // ---------- 1) ref_code로 share 조회 ----------
  let { data: share, error: shareErr } = await supabase
    .from("r3_shares")
    .select("id, ref_code, message_id, created_at")
    .eq("ref_code", ref)
    .maybeSingle();

  // 대소문자/공백 방어 재시도
  if (!share && !shareErr) {
    const { data: share2 } = await supabase
      .from("r3_shares")
      .select("id, ref_code, message_id, created_at")
      .ilike("ref_code", ref)
      .limit(1);
    if (Array.isArray(share2) && share2.length > 0) share = share2[0];
  }

  if (shareErr) {
    console.error("[/r/:ref] share lookup error", { ref, shareErr: String(shareErr) });
  }
  if (!share) {
    console.error("[/r/:ref] share not found (after fallback)", { ref });
    return new NextResponse("Share not found", { status: 404 });
  }

  // ---------- 2) message 조회 (origin_url 폴백 지원) ----------
  const mid = (share.message_id ?? "").toString().trim();
  const { data: msg, error: msgErr } = await supabase
    .from("r3_messages")
    .select("id, title, url, origin_url, description")
    .eq("id", mid)
    .maybeSingle();

  if (msgErr) {
    console.error("[/r/:ref] message lookup error", { ref, message_id: mid, msgErr: String(msgErr) });
  }
  if (!msg) {
    console.error("[/r/:ref] message not found", { ref, message_id: mid });
    return new NextResponse("Message not found", { status: 404 });
  }

  const title = msg.title ?? "R3 Share";
  const targetUrl = msg.url ?? msg.origin_url ?? baseUrl; // url 없으면 origin_url 사용
  const desc = msg.description ?? "공유된 콘텐츠";
  const ogImage = `${baseUrl}/api/ogimage?shareId=${encodeURIComponent(ref)}`;

  // ---------- 3) 미리보기 봇: OG 메타 HTML 반환 ----------
  if (isPreviewBot(ua)) {
    const html = `<!doctype html>
<html lang="ko"><head>
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
</head><body><p>Preview page for bots.</p></body></html>`;
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=120, s-maxage=120",
      },
    });
  }

  // ---------- 4) 일반 사용자: 히트 기록 후 리다이렉트 ----------
  try {
    const shareIdText = (share.id ?? "").toString().trim(); // r3_hits.share_id는 text
    const fp = `${getClientIp(req) ?? "noip"}|${ua.slice(0, 160)}`;

    const { error: insErr } = await supabase.from("r3_hits").insert({
      share_id: shareIdText,
      viewer_fingerprint: fp,
    });

    if (insErr) {
      console.error("[/r/:ref] hits insert failed", {
        ref,
        insErr: String(insErr),
        shareIdText,
      });
    }
  } catch (e) {
    console.error("[/r/:ref] hits insert try/catch error", { ref, error: String(e) });
  }

  return NextResponse.redirect(targetUrl, { status: 302 });
}
