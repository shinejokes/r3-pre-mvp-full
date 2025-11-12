// app/r/[ref]/route.ts
export const dynamic = "force-dynamic"; // 캐시 방지

export async function GET(_req: Request, context: any) {
  const site =
    process.env.NEXT_PUBLIC_SITE_URL || "https://r3-pre-mvp-full.vercel.app";
  const ref = context?.params?.ref ?? "NO_PARAM";
  const v = "12"; // 캐시 무력화용 버전 업

  const title = `R3 v${v} • ${ref}`;
  const img = `${site}/api/ogimage?shareId=${encodeURIComponent(ref)}&v=${v}`;
  const url = `${site}/r/${encodeURIComponent(ref)}`;

  const html = `<!doctype html>
<html lang="ko"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<link rel="canonical" href="${url}"/>

<meta property="og:title" content="${title}">
<meta property="og:description" content="R3 Link Preview">
<meta property="og:url" content="${url}">
<meta property="og:type" content="article">
<meta property="og:image" content="${img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="R3 Link Preview">
<meta name="twitter:image" content="${img}">
</head>
<body style="margin:0;font-family:system-ui,sans-serif">
  <main style="padding:24px">
    <h1>R3 preview • safe route</h1>
    <p>ref: <b>${ref}</b></p>
    <p style="opacity:.6">이 응답은 HTML을 직접 반환합니다(봇/사람 모두 200).</p>
  </main>
</body></html>`;

  return new Response(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
