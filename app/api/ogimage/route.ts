// app/api/ogimage/route.ts

import { NextRequest } from 'next/server'
import { supabaseServer } from '../../../lib/supabaseServer'
import { createCanvas } from 'canvas'

// 이 라우트는 Node.js 런타임에서 돌아야 한다 (이미지 생성 때문에)
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  // 1) URL에서 shareId(ref_code)를 받는다
  //    예: /api/ogimage?shareId=aB3X9fQ
  const { searchParams } = new URL(req.url)
  const shareId = searchParams.get('shareId')

  if (!shareId) {
    return new NextResponse('Missing shareId', { status: 400 })
  }

  const supabase = supabaseServer()

  // 2) r3_shares에서 제목(title) 가져오기
  //    ref_code == shareId 인 row를 찾는다
  const { data: shareRow, error: shareError } = await supabase
    .from('r3_shares')
    .select('title')
    .eq('ref_code', shareId)
    .maybeSingle()

  if (shareError || !shareRow) {
    return new NextResponse('Not found', { status: 404 })
  }

  // 3) r3_hits에서 현재까지의 조회수 count
  //    r3_hits.share_id == shareId 인 row 개수
  const { count, error: countError } = await supabase
    .from('r3_hits')
    .select('*', { count: 'exact', head: true })
    .eq('share_id', shareId)

  const hitsCount = countError || count === null ? 0 : count

  // 4) 캔버스(이미지) 만들기
  //    Open Graph 권장 사이즈 중 하나: 1200 x 630 픽셀
  const width = 1200
  const height = 630
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // ----- 배경 -----
  ctx.fillStyle = '#0F172A' // 어두운 남청/차콜 계열
  ctx.fillRect(0, 0, width, height)

  // ----- 제목(white) -----
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 48px sans-serif'
  drawWrappedText(
    ctx,
    shareRow.title || '(no title)',
    60,
    180,
    width - 120,
    52
  )

  // ----- 조회수 박스 -----
  const viewsText = `조회수 ${hitsCount}회`
  ctx.font = 'bold 64px sans-serif'

  // 텍스트 크기 측정
  const paddingX = 32
  const paddingY = 20
  const metrics = ctx.measureText(viewsText)
  const textW = metrics.width
  const textH = 64 // 폰트 크기를 근사 높이로 사용

  const boxX = 60
  const boxY = height - 60 - textH - paddingY * 2
  const boxW = textW + paddingX * 2
  const boxH = textH + paddingY * 2

  // 박스 배경 (노란색) + 둥근 모서리
  drawRoundRect(ctx, boxX, boxY, boxW, boxH, 20, '#FACC15')

  // 박스 안 텍스트 (어두운 회색)
  ctx.fillStyle = '#1F2937'
  ctx.fillText(
    viewsText,
    boxX + paddingX,
    boxY + paddingY + textH * 0.8 // baseline 보정
  )

  // ----- 하단 브랜드 표시 -----
  ctx.font = 'bold 28px sans-serif'
  ctx.fillStyle = '#94A3B8'
  ctx.fillText('R3 / shared link tracker', 60, height - 40)

  // 5) PNG로 변환해서 응답
 const buffer = new Uint8Array(canvas.toBuffer('image/png'))


  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      // 조회수는 실시간으로 바뀌는 것이므로 캐시를 세게 두지 않는다
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}


// ======= 유틸리티 함수들 ========

// 여러 줄로 텍스트를 적절히 줄바꿈해서 그려주는 함수
function drawWrappedText(
  ctx: any,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ')
  let line = ''
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' '
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line, x, y)
      line = words[i] + ' '
      y += lineHeight
    } else {
      line = testLine
    }
  }
  ctx.fillText(line, x, y)
}

// 둥근 모서리 사각형
function drawRoundRect(
  ctx: any,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fillStyle: string
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
  ctx.fillStyle = fillStyle
  ctx.fill()
}
