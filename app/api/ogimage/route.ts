import { NextRequest } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';
import opentype, { Font, Glyph } from 'opentype.js';
import { supabaseServer } from '../../../lib/supabaseServer';

export const runtime = 'nodejs';

const WIDTH = 1200;
const HEIGHT = 630;

// ---------- 텍스트 → Path 유틸 ----------
type TextPathOptions = {
  x: number;         // 베이스라인 시작 x
  y: number;         // 베이스라인 y
  fontSize: number;  // px
  letterSpacing?: number; // px
  font: Font;
};

// ✅ Buffer → ArrayBuffer (항상 ArrayBuffer 되도록 복사)
function toArrayBuffer(buf: Buffer): ArrayBuffer {
  const copy = new Uint8Array(buf);   // Buffer는 Uint8Array의 서브클래스 → 복사 생성
  return copy.buffer;                 // 항상 ArrayBuffer
}

function textToPathD(text: string, opt: TextPathOptions) {
  const { x, y, fontSize, letterSpacing = 0, font } = opt;
  const scale = fontSize / font.unitsPerEm;

  let dx = 0;
  let prev: Glyph | null = null;
  const parts: string[] = [];

  for (const ch of text) {
    const g = font.charToGlyph(ch);
    if (prev) {
      const kern = font.getKerningValue(prev, g) * scale;
      dx += kern;
    }
    const p = g.getPath(x + dx, y, fontSize);
    parts.push(p.toPathData());
    const adv = g.advanceWidth * scale;
    dx += adv + letterSpacing;
    prev = g;
  }
  return parts.join(' ');
}

function safeText(s: unknown, max = 120) {
  return (s ?? '').toString().slice(0, max);
}
// ---------------------------------------

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ref = searchParams.get('shareId') || '';
    if (!ref) return new Response('Missing shareId', { status: 400 });

    const sb = supabaseServer();

    // 제목
const { data: share } = await sb
  .from('r3_shares')
  .select('id, title, ref_code')  // ✅ id 추가
  .eq('ref_code', ref)
  .maybeSingle();


    const title = safeText(share?.title ?? 'Untitled');

    // 조회수
    const { count: views } = await sb
      .from('r3_hits')
      .select('*', { count: 'exact', head: true })
      .eq('share_id', share!.id);  

    const viewCount = typeof views === 'number' ? views : 0;

    // 🔤 한글 폰트 로드 (Buffer → ArrayBuffer 정확 변환)
    const fontPath = path.join(process.cwd(), 'public', 'fonts', 'NotoSansKR-Regular.ttf');
    const fontBuf = await fs.readFile(fontPath);
    const font = opentype.parse(toArrayBuffer(fontBuf));

    // 텍스트를 path로 변환
    const titleD = textToPathD(title, { x: 100, y: 230, fontSize: 56, font });
    const viewsD = textToPathD(`Views: ${viewCount.toLocaleString()}`, { x: 100, y: 330, fontSize: 40, font });
    const refD   = textToPathD(`Ref: ${ref}`, { x: 100, y: 400, fontSize: 34, font });
    const brandD = textToPathD('R3 • Pre-MVP', { x: 100, y: HEIGHT - 120, fontSize: 30, font });

    // SVG (모든 텍스트는 <path>)
    const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0ea5e9"/>
      <stop offset="100%" stop-color="#22c55e"/>
    </linearGradient>
    <style>
      .card { fill: white; opacity: .9 }
      .title { fill: #0f172a }
      .views { fill: #1e293b }
      .ref   { fill: #334155 }
      .brand { fill: #475569 }
    </style>
  </defs>

  <rect width="100%" height="100%" fill="url(#g)"/>
  <rect x="60" y="60" rx="28" ry="28" width="${WIDTH - 120}" height="${HEIGHT - 120}" class="card"/>

  <path d="${titleD}" class="title"/>
  <path d="${viewsD}" class="views"/>
  <path d="${refD}"   class="ref"/>
  <path d="${brandD}" class="brand"/>
</svg>`.trim();

    const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();

    return new Response(new Uint8Array(pngBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=600, s-maxage=600, immutable',
      },
    });
  } catch (e: any) {
    console.error('[ogimage error]', e);
    return new Response('OG error', { status: 500 });
  }
}
