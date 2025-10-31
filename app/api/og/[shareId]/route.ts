// app/api/og/[shareId]/route.ts
import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Next.js App Router: dynamic functions like this must be "export const runtime = 'edge';"
// if we want Edge runtime. It's nice & fast for OG images.
export const runtime = 'edge';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!; 
  // we’re on the server here, so we can use SERVICE_ROLE_KEY
  // (make sure this route is not exposed to client calls that leak data you don't want.
  // We're only reading public-ish stuff: messages, hits count.)
  return createClient(url, key, {
    auth: { persistSession: false }
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { shareId: string } }
) {
  const shareId = params.shareId;

  const supabase = getSupabase();

  // 1) share 정보 가져오기 (message_id 구하기)
  const { data: shareRow, error: shareErr } = await supabase
    .from('shares')
    .select('message_id')
    .eq('id', shareId)
    .single();

  if (shareErr || !shareRow) {
    return new Response('Not found', { status: 404 });
  }

  // 2) message 정보 가져오기 (제목, 유튜브 썸네일 등)
  //    title 컬럼이 없다면, 지금은 url만 써도 되고,
  //    나중에 message 테이블에 title 넣으면 그걸 쓰면 더 예쁘다.
  const { data: msgRow } = await supabase
    .from('messages')
    .select('title, url')
    .eq('id', shareRow.message_id)
    .single();

  const title = msgRow?.title ?? '공유된 영상';
  const videoUrl = msgRow?.url ?? '';

  // 유튜브 썸네일 간단 추출 (youtube.com/watch?v=VIDEOID 형태라고 가정)
  // 안전하게 하려면 정규식 parsing 필요하나, 여기서는 간단히 처리
  let thumbUrl = '';
  {
    const match = videoUrl.match(/v=([^&]+)/);
    if (match) {
      const vid = match[1];
      thumbUrl = `https://img.youtube.com/vi/${vid}/hqdefault.jpg`;
    }
  }

  // 3) hits 카운트 구하기
  const { data: hitsRows } = await supabase
    .from('hits')
    .select('id')
    .eq('share_id', shareId);

  const viewCount = hitsRows ? hitsRows.length : 0;

  // 4) ImageResponse로 PNG 만들기
  //    아래의 JSX는 "이미지 캔버스"처럼 렌더된다.
  //    flex, background, border-radius 등 기본 CSS 일부 사용 가능
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#000', // 검은 배경
          color: 'white',
          padding: '40px',
          justifyContent: 'space-between',
          fontSize: 40,
          fontFamily: 'sans-serif'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'row', gap: '40px' }}>
          {/* 썸네일 박스 */}
          <div
            style={{
              width: '480px',
              height: '270px',
              backgroundColor: '#333',
              borderRadius: '16px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {thumbUrl
              ? (
                <img
                  src={thumbUrl}
                  width={480}
                  height={270}
                  style={{ objectFit: 'cover' }}
                />
              )
              : (
                <div style={{ fontSize: 28, color: '#aaa' }}>
                  No thumbnail
                </div>
              )
            }
          </div>

          {/* 텍스트 정보 */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div
              style={{
                fontSize: 48,
                fontWeight: 700,
                color: 'white',
                marginBottom: '24px'
              }}
            >
              {title}
            </div>
            <div style={{ fontSize: 32, color: '#ccc' }}>
              지금까지 {viewCount}명이 보았습니다
            </div>
            <div style={{ fontSize: 24, color: '#888', marginTop: '16px' }}>
              공유 링크: {shareId}
            </div>
          </div>
        </div>

        <div
          style={{
            fontSize: 28,
            color: '#aaa',
            textAlign: 'right'
          }}
        >
          R3 pre-MVP
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
