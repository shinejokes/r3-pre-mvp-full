// app/share/[messageId]/page.tsx
'use client'

import React, { useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'

export default function SharePage() {
  // URL 세그먼트에서 messageId 읽기
  const params = useParams<{ messageId?: string }>()
  const searchParams = useSearchParams()

  const initialMessageId = (params?.messageId as string) || ''
  // searchParams null 가능성 안전 처리
  const parentRefCode =
    (searchParams && searchParams.get('parentRefCode')) || ''

  const [messageId, setMessageId] = useState(initialMessageId)
  const [sharerName, setSharerName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [hop, setHop] = useState<number | null>(null)

  const handleCreateShare = async () => {
    setLoading(true)
    setError(null)
    setShareUrl(null)

    const trimmedMessageId = messageId.trim()
    if (!trimmedMessageId) {
      setError('메시지 ID를 입력해 주세요.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/create-share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId: trimmedMessageId,
          parentRefCode: parentRefCode || null,
          sharerName: sharerName.trim() || null,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.ok) {
        setError(data.error || '공유 링크 생성에 실패했습니다.')
        setLoading(false)
        return
      }

      const origin =
        typeof window !== 'undefined' ? window.location.origin : ''

      const url = `${origin}/r/${data.refCode}`
      setShareUrl(url)
      setHop(data.hop ?? null)
    } catch (e) {
      console.error(e)
      setError('서버 통신 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      alert('링크를 클립보드에 복사했습니다.')
    } catch {
      alert('복사에 실패했습니다. 직접 선택해서 복사해 주세요.')
    }
  }

  return (
    <div
      style={{
        maxWidth: 480,
        margin: '40px auto',
        padding: '24px',
        borderRadius: 16,
        border: '1px solid #ddd',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>내 공유 링크 만들기</h1>
      <p style={{ fontSize: 14, color: '#555', marginBottom: 24 }}>
        이 메시지에 대한 나만의 공유 링크를 만들고,
        <br />
        카카오톡 등으로 퍼나르면, 조회수와 hop이 함께 기록됩니다.
      </p>

      {/* 메시지 ID 입력 */}
      <label
        style={{
          display: 'block',
          fontSize: 14,
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        메시지 ID:
      </label>
      <input
        type="text"
        value={messageId}
        onChange={(e) => setMessageId(e.target.value)}
        placeholder="r3_messages 테이블의 id를 붙여 넣으세요."
        style={{
          width: '100%',
          padding: '8px 10px',
          borderRadius: 8,
          border: '1px solid #ccc',
          marginBottom: 16,
          fontSize: 13,
          fontFamily: 'monospace',
        }}
      />

      <label
        style={{
          display: 'block',
          fontSize: 14,
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        내 이름 / 닉네임 (선택)
      </label>
      <input
        type="text"
        value={sharerName}
        onChange={(e) => setSharerName(e.target.value)}
        placeholder="예: 홍길동, JKShin, ..."
        style={{
          width: '100%',
          padding: '8px 10px',
          borderRadius: 8,
          border: '1px solid #ccc',
          marginBottom: 16,
          fontSize: 14,
        }}
      />

      <button
        type="button"
        onClick={handleCreateShare}
        disabled={loading}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 999,
          border: 'none',
          fontSize: 15,
          fontWeight: 600,
          cursor: loading ? 'default' : 'pointer',
          background: loading ? '#999' : '#2b6cb0',
          color: 'white',
        }}
      >
        {loading ? '만드는
