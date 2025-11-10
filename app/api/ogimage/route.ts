// app/api/ogimage/route.ts
import { NextRequest } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';
// Supabase 서버 클라이언트 (자네 프로젝트의 경로에 맞춰 사용)
// 기존
// import { supabaseServer } from '@/lib/supabaseServer';

// 변경 (프로젝트 구조가 보통 이렇다면)
import { supabaseServer } from '../../../lib/supabaseServer';


export const runtime = 'nodejs';

const WIDTH = 1200;
const HEIGHT = 630;

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) =>
    c === '<' ? '&lt;' :
    c === '>' ? '&gt;' :
    c === '&' ? '&amp;' :
    c === '"' ? '&quot;' :
    '&#39;'
  );
}

// public/fonts/NotoSansKR-Regular.ttf → base64로 읽어서 SVG에 임베드
async function loadFontBase64(): Promise<string> {
  const fontPath = path.join(process.cwd(), 'public', 'fonts', 'NotoSansKR-Regular.ttf');
  const buf = await fs.readFile(fontPath);
  return buf.toString('base64');
}

function svgTemplate(params: { title: string; views: number; ref: string; fontB64: string }) {
  const { title, views, ref, fontB64 } = params;
  return `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0ea5e9"/>
      <stop offset="100%" stop-color="#22c55e"/>
    </linearGradient>
  </defs>

  <style><![CDATA[
    @font-face {
      font-family: 'NotoSansKR';
      src: url('data:font/ttf;base64,${fontB64}') format('truetype');
      font-weight: 400;
      font-style: normal;
    }
    .title { font-family: 'NotoSansKR', sans-serif; font-size: 56px; font-weight: 700; fill: #0f172a; }
    .views { font-family: 'NotoSansKR', sans-serif; font-size: 40px; font-weight: 600; fill: #1e293b; }
    .ref   { font-family: 'NotoSansKR', sans-serif; font-size: 34px; fill: #334155; }
    .brand { font-family: 'NotoSansKR', sans-serif; font-size: 30px; fill: #475569; }
  ]]></style>

  <rect width="100%" height="100%" fill="url(#g)"/>
  <rect x="60" y="60" rx="28" ry="28" width="${WIDTH - 120}" height="${HEIGHT - 120}" fill="white" opacity="0.9"/>

  <text x="100" y="230" class="title">${escapeXml(title).slice(0, 80)}</text>
  <text x="100" y="330" class="views">Views: ${views.toLocaleString()}</text>
  <text x="100" y="400" class="ref">Ref: ${escapeXml(ref)}</text>
  <text x="100" y="${HEIGHT - 120}" class="brand">R3 • Pre-MVP</text>
</svg>`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ref = searchParams.get('shareId') || '';
    if (!ref) return new Response('Missing shareId', { status: 400 });

    const sb = supabaseServer();

    // 1) 제목 가져오기 (r3_shares.title)
    //    - ref_code 컬럼명은 자네 DB에 맞춰 사용. 필요하면 eq('ref', ref)로 바꾸면 됨.
    const { data: share, error: shareErr } = await sb
      .from('r3_shares')
      .select('title, ref_code')
      .eq('ref_code', ref)
      .maybeSingle();

    if (shareErr) console.warn('[ogimage] share select warn:', shareErr);

    const title = share?.title ?? 'Untitled';

    // 2) 조회수 집계 (r3_hits에서 ref_code=ref 카운트)
    //    - 컬럼명이 다르면 .eq('share_ref', ref) 로 바꾸면 됨.
    const { count: views, error: countErr } = await sb
      .from('r3_hits')
      .select('*', { count: 'exact', head: true })
      .eq('ref_code', ref);

    if (countErr) console.warn('[ogimage] hits count warn:', countErr);
    const viewCount = typeof views === 'number' ? views : 0;

    // 3) SVG 생성 후 Sharp로 PNG 변환
    const fontB64 = await loadFontBase64();
    const svg = svgTemplate({ title, views: viewCount, ref, fontB64 });
    const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();

    return new Response(pngBuffer, {
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
