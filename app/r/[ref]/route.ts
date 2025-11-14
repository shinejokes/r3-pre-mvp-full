// app/r/[ref]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  // /r/g49JtZU → ["r", "g49JtZU"] → 마지막 세그먼트 사용
  const segments = url.pathname.split("/").filter(Boolean);
  const shareId = segments[segments.length - 1] || "NO_PARAM";

  const supabase = supabaseServer();

  // 1) 이 ref_code에 해당하는 공유 레코드 찾기
  const { data: share, error: shareError } = await supabase
    .from("r3_shares")
    .select("id, title, original_url, target_url")
    .eq("ref_code", shareId)
    .maybeSingle();

  if (shareError) {
    console.error("shareError:", shareError);
  }

  const targetUrl =
    share?.target_url || share?.original_url || null;

  const origin = url.origin;
  const canonicalUrl = `${origin}/r/${shareId}`;
 const ogImageUrl = `${origin}/api/ogimage?shareId=${encodeURIComponent(
  shareId
)}&v=13`;  // 또는 20251114 같이 아무 숫자나 새로


  const baseTitle = `R3 v12 • ${shareId}`;
  const title = share?.title ? `${baseTitle} • ${share.title}` : baseTitle;

  // 2) User-Agent 보고 "봇인지 사람인지" 판단
  const userAgent = req.headers.get("user-agent") || "";
  const isBot = /bot|kakao|facebookexternalhit|Twitterbot|Slackbot|WhatsApp|Discordbot/i.test(
    userAgent
  );

  // 3) 사람(봇이 아님) + targetUrl이 있으면: hits 기록 후 원본으로 리다이렉트
  if (!isBot && targetUrl) {
    try {
      // r3_hits 스키마에 맞게 share_id만 넣는다고 가정
      await supabase.from("r3_hits").insert({
        share_id: share?.id ?? null,
      });
    } catch (hitError) {
      console.error("hit insert error:", hitError);
      // hits가 실패해도 리다이렉트는 계속 진행
    }

    return NextResponse.redirect(targetUrl, 302);
  }

  // 4) 그 외(봇이거나 targetUrl이 없는 경우)는 기존처럼 HTML + 메타 태그 반환
  const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${title}</title>

    <link rel="canonical" href="${canonicalUrl}" />

    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="R3 Link Preview" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:type" content="article" />
    <meta property="og:image" content="${ogImageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="R3 Link Preview" />
    <meta name="twitter:image" content="${ogImageUrl}" />
  </head>
  <body>
    <p>R3 Link Preview for <strong>${shareId}</strong></p>
    ${
      targetUrl
        ? `<p>원본으로 이동: <a href="${targetUrl}">${targetUrl}</a></p>`
        : `<p>등록된 대상 URL을 찾을 수 없습니다.</p>`
    }
  </body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store, max-age=0",
    },
  });
}
