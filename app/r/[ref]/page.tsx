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

  // 1) ref_code로 share 조회 (id 필요!)
  const { data: share, error: shareErr } = await sb
    .from('r3_shares')
    .select('id, target_url, message_id')
    .eq('ref_code', ref)
    .maybeSingle();
  if (shareErr) console.error('[redirect] share select error:', shareErr);

  // 2) 대상 URL
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
  if (!target || !share?.id) {
    console.warn('[redirect] target or share.id missing for ref:', ref);
    redirect('/');
  }

  // 3) 조회수 +1 (share_id로 저장)
  try {
    const { error: insertErr } = await sb
      .from('r3_hits')
      .insert({ share_id: share.id })     // ← 핵심
      .select()
      .single();
    if (insertErr) console.error('[hits] insert error:', insertErr);
  } catch (e) {
    console.error('[hits] insert exception:', e);
  }

  // 4) 리다이렉트
  redirect(target!);
}
