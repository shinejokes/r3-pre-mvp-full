// app/r/[shareId]/page.tsx
import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

// helper
function getSupabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // server only
    { auth: { persistSession: false } }
  );
}

// 1) 이 함수는 head 메타태그용
export async function generateMetadata({ params }: { params: { shareId: string } }) {
  const supabase = getSupabaseServer();
  const shareId = params.shareId;

  // share → message → hits
  const { data: shareRow } = await supabase
    .from('shares')
    .select('message_id')
    .eq('id', shareId)
    .single();

  if (!shareRow) {
    return {
      title: '링크를 찾을 수 없습니다',
      description: '잘못된 공유 링크입니다.',
    };
  }

  const { data: msgRow } = await supabase
    .from('messages')
    .select('title, url')
    .eq('id', shareRow.message_id)
    .single();

  const title = msgRow?.title ?? '공유된 영상';
  const videoUrl = msgRow?.url ?? '';

  // hits count
  const { data: hitsRows } = await supabase
    .from('hits')
    .select('id')
    .eq('share_id', shareId);

  const viewCount = hitsRows ? hitsRows.length : 0;

  // og:image URL => 우리가 방금 만든 API 라우트
  const ogImageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/og/${shareId}`;

  return {
    title: title,
    description: `지금까지 ${viewCount}명이 봤습니다.`,
    openGraph: {
      title: title,
      description: `지금까지 ${viewCount}명이 봤습니다.`,
      images: [ogImageUrl],
    },
    // (원하면 twitterCard 등도 넣을 수 있음)
  };
}

// 2) 이건 실제 페이지 본문
export default async function ShareRedirectPage({ params }: { params: { shareId: string } }) {
  const supabase = getSupabaseServer();
  const shareId = params.shareId;

  // 1. share → message_id
  const { data: shareRow } = await supabase
    .from('shares')
    .select('message_id')
    .eq('id', shareId)
    .single();

  if (!shareRow) {
    return <div>링크를 찾을 수 없습니다.</div>;
  }

  // 2. hits INSERT (사람이 실제로 이 페이지를 열었을 때 카운트 추가)
  //    여기서 한 가지 현실적 문제:
  //    generateMetadata도 supabase에 접근했기 때문에, 카카오톡 봇이 메타만 가져가도 hits를 늘릴 수 있다.
  //    만약 "봇 조회는 카운트 안 올린다"를 원하면,
  //    hits INSERT는 client-side (useEffect)에서만 하도록 바꾸는 게 깔끔하다.
  await supabase.from('hits').insert({ share_id: shareId });

  // 3. message url 가져오기
  const { data: msgRow } = await supabase
    .from('messages')
    .select('url')
    .eq('id', shareRow.message_id)
    .single();

  const videoUrl = msgRow?.url ?? '';

  // 4. 즉시 redirect
  //    next/navigation의 redirect()는 서버에서 곧바로 브라우저를 다른 URL로 보냄.
  redirect(videoUrl);
}
