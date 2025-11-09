import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

function getBaseUrl(req: NextRequest) {
  // Vercel/프록시 환경에서도 절대URL 생성
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

function isPreviewBot(ua: string) {
  // 주요 스크래퍼 User-Agent 식별
  return /(Kakao|facebookexternalhit|Facebot|Twitterbot|Slackbot|Discordbot|LinkedInBot|TelegramBot|WhatsApp|Google-Structured-Data)/i.test(ua);
}

export async function GET(req: NextRequest, { params }: { params: { ref: string } }) {
  const { ref } = params;
  const ua = req.headers.get("user-agent") || "";
  const baseUrl = getBaseUrl(req);

  const supabase = supabaseServer();

  // 1) ref_code로 share + message 조인 조회
  const { data: share, error } = await supabase
    .from("r3_shares")
    .select(`
      id,
      ref_code,
      message_id,
      created_at,
      messages:r3_messages (
        id, title, url, description
      )
    `)
    .eq("ref_code", ref)
    .single();

  if (error || !share || !share.messages) {
    // 없으면 404
    return new NextResponse("Share not found", { status: 404 });
  }

// (기존)
// const title = share.messages.title ?? "R3 Share";
// const targetUrl = share.messages.url;
// const desc = share.messages.description ?? "공유된 콘텐츠";

// (수정)
const msg = Array.isArray(share.messages) ? share.messages[0] : share.messages;
const title = msg?.title ?? "R3 Share";
const targetUrl = msg?.url ?? baseUrl; // 혹시 없을 때 대비
const desc = msg?.description ?? "공유된 콘텐츠";
const ogImage = `${baseUrl}/api/ogimage?shareId=${encodeURIComponent(ref)}`; // 우리가 만든 계수기 썸네일

  if (isPreviewBot(ua)) {
    // 2) 미리보기 봇: OG 메타 HTML 반환 (리다이렉트 금지)
    //   - 카카오/페북 등은 이 HTML의 메타태그를 읽고 카드 이미지를 생성합니다.
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

    <!-- 트위터 카드 -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(desc)}" />
    <meta name="twitter:image" content="${ogImage}" />

    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <!-- 미리보기 봇에게만 제공되는 페이지. 사용자는 보지 않습니다. -->
    <p>Preview page for bots.</p>
  </body>
</html>`;
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        // 봇 캐시가 너무 오래가면 카운터 그림이 안 바뀔 수 있어 약하게 캐시
        "Cache-Control": "public, max-age=120, s-maxage=120"
      }
    });
  }

  // 3) 일반 사용자: hits에 기록 후 원본으로 302
  await supabase.from("r3_hits").insert({
    share_ref_code: ref,
    user_agent: ua.slice(0, 500),
    referer: req.headers.get("referer")?.slice(0, 500) ?? null,
    ip_hash: (req.ip ?? "").slice(0, 100) || null,
  });

  return NextResponse.redirect(targetUrl, { status: 302 });
}

// 간단한 HTML escape 유틸
function escapeHtml(str: string) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
