// app/r/[ref]/route.ts
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  const url = new URL(req.url)

  // /r/F6C8uDm → ["r", "F6C8uDm"] → 마지막 세그먼트 사용
  const segments = url.pathname.split('/').filter(Boolean)
  let shareId = segments[segments.length - 1] || 'NO_PARAM'

  const origin = url.origin
  const canonicalUrl = `${origin}/r/${shareId}`
  const ogImageUrl = `${origin}/api/ogimage?shareId=${encodeURIComponent(
    shareId,
  )}&v=12`

  const title = `R3 v12 • ${shareId}`

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
  </body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
    },
  })
}
