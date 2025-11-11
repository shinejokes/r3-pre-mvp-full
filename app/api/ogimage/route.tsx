// app/api/ogimage/route.tsx
import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';
import { supabaseServer } from '../../../lib/supabaseServer';

export const runtime = 'edge';               // ← 플랜 B
export const alt = 'R3 Share Preview';
export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };

// ---- YouTube helpers ----
function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (host.includes('youtu.be')) {
      const id = u.pathname.split('/')[1];
      return id || null;
    }
    if (host.includes('youtube.com') || host.includes('youtube-nocookie.com')) {
      const v = u.searchParams.get('v');
      if (v) return v;
      const parts = u.pathname.split('/').filter(Boolean);
      const i = parts.findIndex((p) => p === 'shorts');
      if (i >= 0 && parts[i + 1]) return parts[i + 1];
    }
  } catch {}
  return null;
}

function getYouTubeThumb(ytId: string | null) {
  if (!ytId) return { main: null as string | null, fallback: null as string | null };
  return {
    main: `https://i.ytimg.com/vi/${ytId}/maxresdefault.jpg`,
    fallback: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shareId = searchParams.get('shareId') || searchParams.get('ref') || '';
  if (!shareId) return new Response('Missing shareId', { status: 400 });

  const sb = supabaseServer();

  // 1) share (title/original_url 폴백 포함)
  const { data: shareRow, error: shareErr } = await sb
    .from('r3_shares')
    .select('id, ref_code, message_id, title, original_url')
    .eq('ref_code', shareId)
    .single();

  if (shareErr || !shareRow) return new Response('Share not found', { status: 404 });

  // 2) message (*로 받아 스키마차 흡수)
  let msgRow: any = null;
  if (shareRow.message_id) {
    const { data, error } = await sb
      .from('r3_messages')
      .select('*')
      .eq('id', shareRow.message_id)
      .maybeSingle();
    if (!error && data) msgRow = data;
  }

  // 3) 제목/URL (message > share 폴백)
  const title: string =
    (msgRow?.title as string) ||
    (shareRow.title as string) ||
    '제목 없음';

  const originalUrl: string =
    (msgRow?.origin_url ||
      msgRow?.original_url ||
      msgRow?.url ||
      msgRow?.link ||
      msgRow?.link_url) ||
    (shareRow.original_url as string) ||
    '';

  // 4) 조회수
  const { count: hitsCount } = await sb
    .from('r3_hits')
    .select('id', { count: 'exact', head: true })
    .eq('share_id', shareRow.id);
  const views = typeof hitsCount === 'number' ? hitsCount : 0;

  // 5) 썸네일
  const ytId = extractYouTubeId(originalUrl);
  const { main: thumbUrl, fallback: thumbUrlFallback } = getYouTubeThumb(ytId);

  // 6) 렌더 (모든 컨테이너에 display 명시)
  const W = size.width, H = size.height, innerW = W - 72, innerH = H - 72;

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #111827 60%, #1f2937 100%)',
          color: '#e5e7eb',
          padding: 36,
          boxSizing: 'border-box',
          fontFamily: 'sans-serif',
        }}
      >
        {/* 카드 컨테이너 */}
        <div
          style={{
            position: 'relative',
            width: innerW,
            height: innerH,
            borderRadius: 24,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'radial-gradient(1000px 400px at 20% 20%, rgba(255,255,255,0.06), rgba(0,0,0,0))',
            display: 'flex',            // ★ 명시
            alignItems: 'stretch',
            justifyContent: 'center',
          }}
        >
          {/* 배경: 썸네일 or 폴백 */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',          // ★ 명시
            }}
          >
            {thumbUrl ? (
              <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex' }}>
                <img
                  src={thumbUrl}
                  width={innerW}
                  height={innerH}
                  style={{ objectFit: 'cover' }}
                />
                {thumbUrlFallback ? (
                  <img
                    src={thumbUrlFallback}
                    width={innerW}
                    height={innerH}
                    style={{
                      objectFit: 'cover',
                      position: 'absolute',
                      inset: 0,
                      zIndex: -1,       // ★ 숫자
                      opacity: 0.001,   // 로딩 실패시만 실질 영향(Edge의 중첩 요구 회피)
                    }}
                  />
                ) : null}
              </div>
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',        // ★ 명시
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #111827 0%, #0b1220 100%)',
                  fontSize: 42,
                  letterSpacing: 0.5,
                  color: '#9ca3af',
                }}
              >
                원본 썸네일 없음
              </div>
            )}
          </div>

          {/* 좌상단 R3 배지 */}
          <div
            style={{
              position: 'absolute',
              top: 18,
              left: 18,
              padding: '8px 14px',
              borderRadius: 999,
              fontSize: 24,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',           // ★ 명시
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            R3
          </div>

          {/* 우상단 조회수 배지 */}
          <div
            style={{
              position: 'absolute',
              top: 18,
              right: 18,
              display: 'flex',           // ★ 명시
              alignItems: 'center',
              gap: 10,
              padding: '10px 16px',
              borderRadius: 999,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.06)',
              fontSize: 28,
            }}
          >
            <span style={{ opacity: 0.9 }}>조회수</span>
            <strong style={{ fontWeight: 800 }}>{views.toLocaleString()}</strong>
          </div>

          {/* 하단 정보 바 */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              padding: '20px 24px',
              background:
                'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0.65) 100%)',
              display: 'flex',           // ★ 명시
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div
              style={{
                fontSize: 40,
                lineHeight: 1.18,
                fontWeight: 800,
                color: 'white',
                textShadow: '0 1px 0 rgba(0,0,0,0.35)',
                maxHeight: 92,
                overflow: 'hidden',
                display: 'flex',         // ★ 명시
              }}
            >
              {title}
            </div>

            {originalUrl ? (
              <div
                style={{
                  fontSize: 24,
                  opacity: 0.9,
                  color: '#e5e7eb',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'flex',       // ★ 명시
                }}
              >
                {originalUrl}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=300',
      },
    }
  );
}
