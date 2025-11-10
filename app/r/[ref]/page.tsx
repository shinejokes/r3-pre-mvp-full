// app/r/[ref]/page.tsx
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { supabaseServer } from '../../../lib/supabaseServer';

export const dynamic = 'force-dynamic';

type Params = { params: { ref: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const base = process.env.NEXT_PUBLIC_BASE_URL || '';
  const og = `${base}/api/ogimage?shareId=${params.ref}`;
  return {
    title: 'R3 Link',
    openGraph: {
      images: [{ url: og, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      images: [og],
    },
  };
}

export default async function RRedirectPage({ params }: Params) {
  const ref = params.ref;
  const sb = supabaseServer();

  // 1) 리다이렉트 대상 URL 조회
  const { data: share } = await sb
    .from('r3_shares')
    .select('target_url, message_id')
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

  if (!target) {
    console.warn('[redirect] target url not found for ref:', ref);
    redirect('/'); // 안전장치
  }

  // 2) 조회수 +1 (봇/프리페치/미리보기 제외)
  try {
    const h = headers();
    const ua = (h.get('user-agent') || '').toLowerCase();
    const purpose = (h.get('purpose') || '').toLowerCase();          // chrome old
    const secPurpose = (h.get('sec-purpose') || '').toLowerCase();   // chrome new
    const isPrefetch =
      purpose.includes('prefetch') || secPurpose.includes('prefetch') || secPurpose.includes('prerender');

    const isBot = /bot|crawl|spider|slurp|facebookexternalhit|embedly|pinterest|quora link preview|slackbot|twitterbot|whatsapp|telegrambot|discordbot|linkedinbot|vkshare|skypeuripreview/i.test(
      ua
    );

    if (!isBot && !isPrefetch) {
      // 스키마에 ref_code만 있어도 동작합니다.
      await sb.from('r3_hits').insert({ ref_code: ref });
      // 메타데이터를 저장하고 싶다면, 컬럼이 있을 때만 사용:
      // await sb.from('r3_hits').insert({ ref_code: ref, user_agent: ua, referer: h.get('referer') ?? null });
    }
  } catch (e) {
    console.warn('[hits] insert skipped:', e);
  }

  // 3) 외부로 리다이렉트
  redirect(target!);
}
