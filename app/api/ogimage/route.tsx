 
// app/api/ogimage/route.ts
import { NextRequest } from 'next/server';
import { Resvg } from '@resvg/resvg-js';
// 필요 시: import { supabaseServer } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

const WIDTH = 1200;
const HEIGHT = 630;

function svgTemplate(params: {
  title: string;
  views: number;
  ref: string;
}) {
  const { title, views, ref } = params;

  // 외부 CSS/필터 없이, 순수 SVG만 사용 (satori/Edge가 싫어하는 요소 제거)
  // 배경은 단색 + 간단한 장식, 텍스트는 시스템 폰트 fallback + 우리가 로드할 TTF
  return `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0ea5e9"/>
      <stop offset="100%" stop-color="#22c55e"/>
    </linearGradient>
  </defs>

  <rect width="100%" height="100%" fill="url(#g)"/>

  <!-- 카드 -->
  <rect x="60" y="60" rx="28" ry="28" width="${WIDTH - 120}" height="${HEIGHT - 120}"
        fill="white" opacity="0.9"/>

  <!-- 타이틀 -->
  <text x="100" y="230" font-size="56" font-weight="700" fill="#0f172a">
    ${escapeXml(title).slice(0, 80)}
  </text>

  <!-- 뷰 카운트 -->
  <text x="100" y="330" font-size="40" font-weight="600" fill="#1e293b">
    Views: ${views.toLocaleString()}
  </text>

  <!-- ref 코드 -->
  <text x="100" y="400" font-size="34" fill="#334155">
    Ref: ${escapeXml(ref)}
  </text>

  <!-- 브랜드 -->
  <text x="100" y="${HEIGHT - 120}" font-size="30" fill="#475569">R3 • Pre-MVP</text>
</svg>
`;
}

// 간단한 XML escape
function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) => (
    c === '<' ? '&lt;' :
    c === '>' ? '&gt;' :
    c === '&' ? '&amp;' :
    c === '"' ? '&quot;' :
    '&#39;'
  ));
}

async function loadFont(): Promise<Uint8Array> {
  // public 폴더의 TTF를 바이너리로 로드
  const url = new URL('../../../public/fonts/NotoSansKR-Regular.ttf', import.meta.url);
  const res = await fetch(url);
  const buf = new Uint8Array(await res.arrayBuffer());
  return buf;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shareId = searchParams.get('shareId') || '';
    if (!shareId) {
      return new Response('Missing shareId', { status: 400 });
    }

    // 1) DB에서 데이터 로드 (예시)
    // const sb = supabaseServer();
    // const { data, error } = await sb
    //   .from('r3_shares')
    //   .select('title, views:views_count, ref_code')
    //   .eq('ref_code', shareId)
    //   .single();
    // if (error) throw error;

    // 여기서는 일단 더미로 진행 (실데이터 연결 시 위 코드 주석 해제)
    const data = {
      title: '공유된 메시지 제목 예시',
      views: 1234,
      ref_code: shareId,
    };

    const svg = svgTemplate({
      title: data.title || 'Untitled',
      views: typeof data.views === 'number' ? data.views : 0,
      ref: data.ref_code || shareId,
    });

    const font = await loadFont();

    // 2) Resvg로 PNG 렌더링
    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: WIDTH }, // viewBox 기준 맞춤
      font: {
        fontFiles: [font],        // 우리가 로드한 TTF를 임베드
        loadSystemFonts: false,   // 환경 의존성 제거
      },
      // shapeRendering, textRendering 등 기본값이면 충분
    });

    const png = resvg.render().asPng();

    return new Response(png, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        // 카카오/OG 크롤러 캐시 고려: 배포 중엔 적절히 조정
        'Cache-Control': 'public, max-age=600, s-maxage=600, immutable',
      },
    });
  } catch (e: any) {
    console.error('[ogimage error]', e);
    return new Response('OG error', { status: 500 });
  }
}
