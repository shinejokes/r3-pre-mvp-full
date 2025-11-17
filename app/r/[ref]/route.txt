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

  // 1) ref_code로 공유 레코드 조회
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
  )}&v=20`; // 캐시 버전 (숫자 올리면 카카오/유튜브가 새로 그림을 받아감)

  // 2) 카카오/트위터 등에 보낼 "깔끔한 제목" 만들기
  //    - 원본 제목이 있으면 그대로 사용
  //    - 없으면 도메인(youtu.be, youtube.com 등)만 사용
  let cleanTitle = "R3 Link";
  if (share?.title && share.title.trim()) {
    cleanTitle = share.title.trim();
  } else {
    const fallbackUrl =
      targetUrl || share?.original_url || origin;
    try {
      const u = new URL(fallbackUrl);
      cleanTitle = u.hostname.replace(/^www\./, "");
    } catch {
      cleanTitle = "R3 Link";
    }
  }

  const description = "R3 Link Preview";

  // 3) User-Agent로 봇/사람 구분
  const userAgent = req.headers.get("user-agent") || "";
  const isBot = /bot|kakao|facebookexternalhit|Twitterbot|Slackbot|WhatsApp|Discordbot/i.test(
    userAgent
  );

  // 4) 사람 + targetUrl 존재 → hits 기록 후 원본으로 리다이렉트
  if (!isBot && targetUrl) {
    try {
      if (share?.id) {
        await supabase.from("r3_hits").insert({
          share_id: share.id,
        });
      }
    } catch (hitError) {
      console.error("hit insert error:", hitError);
      // hits 실패해도 리다이렉트는 그대로 진행
    }

    return NextResponse.redirect(targetUrl, 302);
  }

  // 5) 봇(카카오/트위터 등) → OG 메타 태그 포함한 HTML 반환
  const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${cleanTitle}</title>

    <link rel="canonical" href="${canonicalUrl}" />

    <meta property="og:title" content="${cleanTitle}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:type" content="article" />
    <meta property="og:image" content="${ogImageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${cleanTitle}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${ogImageUrl}" />
  </head>
  <body>
    <p>R3 Link Preview</p>
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
