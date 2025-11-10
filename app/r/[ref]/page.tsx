// app/r/[ref]/page.tsx
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
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

export default async function RRedirectPage({ params }: Params) {
  const ref = params.ref;
  const sb = supabaseServer();

  // 1) 대상 URL 조회 (shares → target_url, 없으면 messages.url)
  const { data: share, error: shareErr } = await sb
    .from('r3_shares')
    .select('id, target_url, message_id')
    .eq('ref_code', ref)
    .maybeSingle();

  if (shareErr) console.error('[redirect] share select error:', shareErr);

  let target = share?.target_url as string | undefined;

  if (!target && share?.message_id) {
    const { data: msg, error: msgErr } = await sb
      .from('r3_messages')
      .select('url')
      .eq('id', share.message_id)
      .maybeSingle();
    if (msgErr) console.warn('[redirect] message select warn:', msgErr);
    target = msg?.url ?? undefined;
  }

  if (!target) {
    console.warn('[redirect] target url not found for ref:', ref);
    redirect('/');
  }

  // 2) 조회수 +1 (테스트용: 필터 없이 확실히 기록)
  try {
    const { error: insertErr } = await sb
      .from('r3_hits')
      .insert({ ref_code: ref }) // ← 우리 카운트 쿼리와 동일 컬럼 사용
      .select()
      .single(); // 서버에서 확정 실행 + 에러 확인

    if (insertErr) {
      console.error('[hits] insert error:', insertErr);
    }
  } catch (e) {
    console.error('[hits] insert exception:', e);
  }

  // 3) 외부로 리다이렉트
  redirect(target!);
}
