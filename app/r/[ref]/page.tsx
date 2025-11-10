// app/r/[ref]/page.tsx
import type { Metadata } from 'next';
import Script from 'next/script';
import { headers } from 'next/headers';
import { supabaseServer } from '../../../lib/supabaseServer';

export const dynamic = 'force-dynamic';

type Params = { params: { ref: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const base = process.env.NEXT_PUBLIC_BASE_URL || '';
  const og = `${base}/api/ogimage?shareId=${params.ref}`;
  return {
    title: 'R3 Link',
    openGraph: { images: [{ url: og, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', images: [og] },
  };
}

export default async function RPreviewAndRedirect({ params }: Params) {
  const ref = params.ref;
  const sb = supabaseServer();

  // 대상 URL 조회
  const { data: share } = await sb
    .from('r3_shares')
    .select('id, target_url, message_id')
    .eq('ref_code', ref)
    .maybeSingle();

  let target = share?.target_url as string | undefined;

  if (!target && share?.message_id) {
    const { data: msg } = await sb
      .from('r3_messages')
      .select('url')
      .eq('id', share.message_id)
      .maybeSingle();
    target = msg?.url ?? undefined;
  }

  if (!target || !share?.id) {
    // 안전장치: 대상이 없으면 홈으로 안내
    return (
      <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        <h1>링크를 찾을 수 없어요</h1>
        <p>ref: {ref}</p>
      </div>
    );
  }

  // 봇/프리페치 제외하고 서버에서 조회수 +1
  try {
    const h = headers();
    const ua = (h.get('user-agent') || '').toLowerCase();
    const purpose = (h.get('purpose') || '').toLowerCase();
    const secPurpose = (h.get('sec-purpose') || '').toLowerCase();
    const isPrefetch =
      purpose.includes('prefetch') || secPurpose.includes('prefetch') || secPurpose.includes('prerender');
    const isBot = /bot|crawl|spider|slurp|facebookexternalhit|embedly|pinterest|quora link preview|slackbot|twitterbot|whatsapp|telegrambot|discordbot|linkedinbot|vkshare|skypeuripreview/i.test(
      ua
    );

    if (!isBot && !isPrefetch) {
      await sb.from('r3_hits').insert({ share_id: share.id }).select().single();
    }
  } catch (e) {
    console.warn('[hits] insert skipped:', e);
  }

  // 여기서는 200 OK로 페이지를 렌더 (OG 메타는 generateMetadata에서 이미 부착됨)
  // 사람은 JS로 즉시 원본으로 이동, 크롤러는 JS 실행 안 하므로 우리 썸네일을 읽음
  return (
    <html lang="ko">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ padding: 24 }}>
          <h1 style={{ marginBottom: 8 }}>잠시만요… 원본으로 이동 중입니다</h1>
          <p>
            열리지 않으면 <a href={target}>여기를 클릭</a>하세요.
          </p>
        </div>

        {/* JS 즉시 이동 (사용자용) */}
        <Script id="r3-client-redirect" strategy="afterInteractive">
          {`window.location.replace(${JSON.stringify(target)});`}
        </Script>

        {/* JS 꺼진 사용자를 위한 매우 짧은 meta-refresh 대안 */}
        <noscript>
          <meta httpEquiv="refresh" content={`0;url=${target}`} />
        </noscript>
      </body>
    </html>
  );
}
