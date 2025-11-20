// app/api/ogimage/route.ts
import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { supabaseServer } from '../../../lib/supabaseServer'

export const runtime = 'edge'

// YouTube URL에서 썸네일 추출
function getYoutubeThumb(url: string | null): string | null {
  if (!url) return null

  try {
    const u = new URL(url)
    const host = u.hostname

    // 1) https://youtube.com/shorts/VIDEO_ID
    if (host.includes('youtube.com') && u.pathname.startsWith('/shorts/')) {
      // /shorts/uvefhEoh4SM -> ["", "shorts", "uvefhEoh4SM"]
      const parts = u.pathname.split('/')
      const id = parts[2]
      if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`
    }

    // 2) https://www.youtube.com/watch?v=VIDEO_ID
    if (host.includes('youtube.com')) {
      const v = u.searchParams.get('v')
      if (v) return `https://img.youtube.com/vi/${v}/hqdefault.jpg`
    }

    // 3) https://youtu.be/VIDEO_ID
    if (host.includes('youtu.be')) {
      const id = u.pathname.replace('/', '')
      if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`
    }
  } catch {
    return null
  }

  return null
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const shareId = searchParams.get('shareId')

  // shareId 없을 때
  if (!shareId) {
    return new ImageResponse(
      {
        type: 'div',
        props: {
          style: {
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#020617',
            color: 'white',
            fontSize: 40,
            fontWeight: 700,
          },
          children: 'R3 · Missing shareId',
        },
      },
      { width: 1200, height: 630 }
    )
  }

  const supabase = supabaseServer()

  // 1) r3_shares에서 정보 가져오기 (original_url 포함!)
  const { data: share, error: shareError } = await supabase
    .from('r3_shares')
    .select('id, title, hop, target_url, original_url, ref_code')
    .eq('ref_code', shareId)
    .maybeSingle()

  if (shareError || !share) {
    return new ImageResponse(
      {
        type: 'div',
        props: {
          style: {
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#020617',
            color: 'white',
            fontSize: 32,
            fontWeight: 700,
          },
          children: `R3 · Link Not Found (${shareId})`,
        },
      },
      { width: 1200, height: 630 }
    )
  }

  const title = (share as any).title ?? 'R3 Shared Link'
  const hop = (share as any).hop ?? 0
  const targetUrl = (share as any).target_url as string | null
  const originalUrl = (share as any).original_url as string | null

  // target_url 없으면 original_url 사용
  const effectiveUrl = targetUrl || originalUrl || null
  const thumbUrl = getYoutubeThumb(effectiveUrl)

  // 2) r3_hits에서 조회수 count
  let views = 0
  try {
    const { count } = await supabase
      .from('r3_hits')
      .select('*', { count: 'exact', head: true })
      .eq('share_id', (share as any).id)

    views = count ?? 0
  } catch {
    views = 0
  }

  // 3) 최종 OG 이미지
  return new ImageResponse(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'linear-gradient(135deg, #020617 0%, #0f172a 45%, #020617 100%)',
          color: '#e5e7eb',
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
        children: {
          type: 'div',
          props: {
            style: {
              display: 'flex', // children 배열 → flex 필수
              flexDirection: 'column',
              alignItems: 'center',
              gap: 20,
              maxWidth: 1000,
            },
            children: [
              // 상단 라벨
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: 22,
                    letterSpacing: 4,
                    textTransform: 'uppercase',
                    color: '#38bdf8',
                  },
                  children: 'R3 · Hand-Forwarded Link',
                },
              },

              // 제목
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: 42,
                    fontWeight: 700,
                    textAlign: 'center',
                    lineHeight: 1.3,
                    padding: '0 40px',
                  },
                  children: title,
                },
              },

              // 썸네일 영역
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 24,
                    overflow: 'hidden',
                    width: 800,
                    height: 360,
                    background: '#020617',
                  },
                  children: thumbUrl
                    ? {
                        type: 'img',
                        props: {
                          src: thumbUrl,
                          width: 800,
                          height: 360,
                          style: {
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          },
                        },
                      }
                    : {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: 28,
                            color: '#9ca3af',
                          },
                          children: 'R3 Shared Content',
                        },
                      },
                },
              },

              // 아래쪽 한 줄 배지: R3 · Views · Hop
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 32,
                    padding: '14px 36px',
                    borderRadius: 9999,
                    background: 'rgba(15,23,42,0.96)',
                    border: '1px solid rgba(148,163,184,0.7)',
                    marginTop: -32,
                    boxShadow: '0 22px 40px rgba(15,23,42,0.85)',
                  },
                  children: [
                    {
                      type: 'span',
                      props: {
                        style: {
                          fontSize: 22,
                          fontWeight: 800,
                          letterSpacing: 3,
                          textTransform: 'uppercase',
                          color: '#38bdf8',
                        },
                        children: 'R3',
                      },
                    },
                    {
                      type: 'span',
                      props: {
                        style: {
                          fontSize: 22,
                          fontWeight: 600,
                          color: '#e5e7eb',
                        },
                        children: `Views ${views}`,
                      },
                    },
                    {
                      type: 'span',
                      props: {
                        style: {
                          fontSize: 22,
                          fontWeight: 600,
                          color: '#e5e7eb',
                        },
                        children: `Hop ${hop}`,
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    },
    { width: 1200, height: 630 }
  )
}
