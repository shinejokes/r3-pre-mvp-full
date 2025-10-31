import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '../../../lib/supabaseServer'

export async function GET(
  req: NextRequest,
  { params }: { params: { shareId: string } }
) {
  const supabase = supabaseServer()
  const shareId = params.shareId

  console.log('--- /s route called with shareId =', shareId)

  // 1) r3_shares에서 original_url 가져오기
  const { data: shareRow, error: shareError } = await supabase
    .from('r3_shares')
    .select('original_url')
    .eq('ref_code', shareId)
    .maybeSingle()

  if (shareError) {
    console.error('shareError:', shareError)
  }
  console.log('shareRow:', shareRow)

  if (shareError || !shareRow) {
    return new NextResponse('Not found in r3_shares', { status: 404 })
  }

  // 2) r3_hits에 insert 시도
  const { error: hitError } = await supabase
    .from('r3_hits') // ← 실제 테이블명이 정확히 이것인지 확인 부탁 (r3_hits인지 hits인지)
    .insert([
      {
        share_id: shareId,
        // created_at이 NOT NULL인데 default now()가 없는 경우엔 아래 줄을 풀어줘야 함:
        // created_at: new Date().toISOString(),
      }
    ])

  if (hitError) {
    console.error('hitError:', hitError)
    // 실패해도 redirect는 계속 진행
  } else {
    console.log('hit insert OK for shareId =', shareId)
  }

  // 3) 최종 redirect
  return NextResponse.redirect(shareRow.original_url, 302)
}
