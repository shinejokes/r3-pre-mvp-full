// app/api/create-share/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '../../../lib/supabaseServer'

// 간단한 ref_code 생성기
function generateRefCode(length = 7) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(req: NextRequest) {
  try {
    const supabase = supabaseServer()
    const body = await req.json()

    const {
      messageId,      // 필수: r3_messages.id
      parentRefCode,  // 선택
      sharerName,     // 선택
    } = body as {
      messageId?: string
      parentRefCode?: string | null
      sharerName?: string | null
    }

    if (!messageId || typeof messageId !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'messageId is required' },
        { status: 400 }
      )
    }

    // 기본값: 최초 공유
    let hop = 0
    let parentShareId: string | null = null

    // 부모 ref_code가 있으면 hop 누적
    if (parentRefCode) {
      const { data: parentShare, error: parentError } = await supabase
        .from('r3_shares')               // ✅ 실제 테이블 이름
        .select('id, hop')
        .eq('ref_code', parentRefCode)
        .single()

      if (parentError || !parentShare) {
        console.error('parent share not found:', parentError)
        return NextResponse.json(
          { ok: false, error: 'Parent share not found for given parentRefCode' },
          { status: 400 }
        )
      }

      parentShareId = parentShare.id
      hop = (parentShare.hop ?? 0) + 1
    }

    const refCode = generateRefCode()

    // r3_shares 테이블에 새 share 등록
    const { data: newShare, error: insertError } = await supabase
      .from('r3_shares')                 // ✅ 실제 테이블 이름
      .insert({
        message_id: messageId,
        parent_share_id: parentShareId,
        hop,
        ref_code: refCode,
        sharer_name: sharerName ?? null,
      })
      .select('id, ref_code, hop')
      .single()

    if (insertError || !newShare) {
      console.error('insert share error:', insertError)
      return NextResponse.json(
        { ok: false, error: 'Failed to insert share' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        ok: true,
        shareId: newShare.id,
        refCode: newShare.ref_code,
        hop: newShare.hop,
      },
      { status: 201 }
    )
  } catch (e) {
    console.error('create-share API error:', e)
    return NextResponse.json(
      { ok: false, error: 'Unexpected server error' },
      { status: 500 }
    )
  }
}
