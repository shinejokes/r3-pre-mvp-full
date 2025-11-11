// app/r/[ref]/page.tsx
import { redirect } from 'next/navigation';
import type { Metadata, ResolvingMetadata } from 'next';
import { supabaseServer } from '../../../lib/supabaseServer';

const baseUrl =
  process.env.R3_APP_BASE_URL?.replace(/\/$/, '') ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

type Props = { params: Promise<{ ref: string }> }; // ← Promise 타입으로 변경

// 1) 메타데이터 생성
export async function generateMetadata(
  { params }: Props,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const { ref: shareId } = await params; // ✅ await으로 언랩
  const ogImageUrl = `${baseUrl}/api/ogimage?shareId=${encodeURIComponent(shareId)}`;

  return {
    title: 'R3 공유 미리보기',
    description: 'R3 공유 링크',
    openGraph: {
      type: 'website',
      title: 'R3 공유 미리보기',
      description: 'R3 공유 링크',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: 'R3 Share Preview' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'R3 공유 미리보기',
      description: 'R3 공유 링크',
      images: [ogImageUrl],
    },
    metadataBase: new URL(baseUrl),
  };
}

// 2) 실제 리다이렉트 처리
export default async function ShareRedirectPage({ params }: Props) {
  const { ref } = await params; // ✅ await으로 언랩

  const sb = supabaseServer();

  const { data: share, error: shareErr } = await sb
    .from('r3_shares')
    .select('id, message_id, original_url, title')
    .eq('ref_code', ref)
    .single();

  if (shareErr || !share) {
    redirect('/');
  }

  let targetUrl = share.original_url ?? '';

  if (!targetUrl && share.message_id) {
    const { data: msg } = await sb
      .from('r3_messages')
      .select('*')
      .eq('id', share.message_id)
      .maybeSingle();

    if (msg) {
      targetUrl =
        msg.origin_url ||
        msg.original_url ||
        msg.url ||
        msg.link ||
        msg.link_url ||
        '';
    }
  }

  if (!targetUrl) targetUrl = '/';
  redirect(targetUrl);
}
