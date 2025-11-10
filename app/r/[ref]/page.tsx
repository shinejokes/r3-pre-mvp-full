// app/r/[ref]/page.tsx
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic'; // ref별 동적 처리

type Params = { params: { ref: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const base = process.env.NEXT_PUBLIC_BASE_URL || '';
  const og = `${base}/api/ogimage?shareId=${params.ref}`;

  // 필요시 title/description도 여기서 DB조회 후 넣을 수 있음(간단히 기본값만)
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

  // 1) 리다이렉트 대상 URL 찾기
  //    - 가장 단순: r3_shares에 target_url 컬럼이 있다고 가정
  //    - 없으면 message_id를 통해 r3_messages.url 조인으로 가져오기
  const { data: share, error: shareErr } = await sb
    .from('r3_shares')
    .select('target_url, message_id')
    .eq('ref_code', ref)
    .maybeSingle();

  if (shareErr) {
    console.error('[redirect] share select error:', shareErr);
  }

  let target = share?.target_url as string | undefined;

  if (!target && share?.message_id) {
    // r3_messages.url 로부터 보완
    const { data: msg, error: msgErr } = await sb
      .from('r3_messages')
      .select('url')
      .eq('id', share.message_id)
      .maybeSingle();
    if (msgErr) console.warn('[redirect] message select warn:', msgErr);
    target = msg?.url ?? undefined;
  }

  // 2) 안전장치: 대상이 없으면 홈으로
  if (!target) {
    console.warn('[redirect] target url not found for ref:', ref);
    redirect('/'); // 기본 홈
  }

  // (선택) 여기에 '조회수 증가' 로깅이 서버 액션/엣지 함수로 이미 구현돼 있다면 호출

  // 3) 외부로 즉시 리다이렉트
  redirect(target!);
}
