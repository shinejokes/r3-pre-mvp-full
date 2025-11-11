// app/r/[ref]/page.tsx
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Metadata, ResolvingMetadata } from 'next';
import { supabaseServer } from '../../../lib/supabaseServer';

const baseUrl =
  process.env.R3_APP_BASE_URL?.replace(/\/$/, '') ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

type Props = { params: Promise<{ ref: string }> };

// 1) 메타데이터 생성 (카카오/페북 미리보기용)
export async function generateMetadata(
  { params }: Props,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const { ref: shareId } = await params;
  const ogImageUrl = `${baseUrl}/api/ogimage?shareId=${encodeURIComponent(shareId)}`;

  return {
    title: 'R3 공유 링크',
    description: 'R3 공유 링크 미리보기',
    openGraph: {
      type: 'website',
      title: 'R3 공유 링크',
      description: 'R3 공유 링크 미리보기',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: 'R3 Share Preview' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'R3 공유 링크',
      description: 'R3 공유 링크 미리보기',
      images: [ogImageUrl],
    },
    metadataBase: new URL(baseUrl),
  };
}

// 봇(User-Agent) 판별
function isBot(ua: string) {
  return /kakaotalk|kakaostory|facebookexternalhit|twitterbot|slackbot|discordbot|linkedinbot|embedly|quora|pinterest|vkshare|telegrambot|applebot|whatsapp|bingpreview|google.*snippet/i.test(
    ua
  );
}

// 2) 실제 페이지 — 봇이면 미리보기, 사람이면 즉시 리다이렉트
export default async function ShareRedirectPage({ params }: Props) {
  const { ref } = await params;
  const sb = supabaseServer();

  // 2-1) Supabase에서 share 찾기
  const { data: share } = await sb
    .from('r3_shares')
    .select('id, message_id, original_url, title')
    .eq('ref_code', ref)
    .maybeSingle();

  // 2-2) 최종 이동 URL 계산
  let targetUrl = share?.original_url ?? '';

  if (!targetUrl && share?.message_id) {
    const { data: msg } = await sb
      .from('r3_messages')
      .select('*')
      .eq('id', share.message_id)
      .maybeSingle();

    if (msg) {
      targetUrl =
        (msg as any).origin_url ||
        (msg as any).original_url ||
        (msg as any).url ||
        (msg as any).link ||
        (msg as any).link_url ||
        '';
    }
  }
  if (!targetUrl) targetUrl = '/';

  // 2-3) 봇은 미리보기(200), 사람은 리다이렉트
  const h = await headers();
  const ua = h.get('user-agent') || '';

  if (!isBot(ua)) {
    redirect(targetUrl);
  }

  // 봇에게는 간단한 HTML 반환 (200 OK)
  return (
    <html lang="ko">
      <body style={{ margin: 0, fontFamily: 'sans-serif', padding: 24 }}>
        <p>미리보기 전용 페이지입니다.</p>
        <p>
          원본으로 이동: <a href={targetUrl}>{targetUrl}</a>
        </p>
      </body>
    </html>
  );
}
