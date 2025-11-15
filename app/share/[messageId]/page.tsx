// app/share/[messageId]/page.tsx
'use client'

import React, { useState } from 'react'

type SharePageProps = {
  params: {
    messageId: string
  }
  searchParams?: {
    parentRefCode?: string
  }
}

export default function SharePage({ params, searchParams }: SharePageProps) {
  const { messageId } = params
  const parentRefCode = searchParams?.parentRefCode || ''

  const [sharerName, setSharerName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [hop, setHop] = useState<number | null>(null)

  const handleCreateShare = async () => {
    setLoading(true)
    setError(null)
    setShareUrl(null)

    try {
      const res = await fetch('/api/create-share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
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

      <div
        style={{
          fontSize: 13,
          padding: '8px 10px',
          borderRadius: 8,
          background: '#f7f7f7',
          marginBottom: 16,
        }}
      >
        <div>
          <strong>메시지 ID:</strong> {messageId}
        </div>
        {parentRefCode && (
          <div>
            <strong>부모 ref_code:</strong> {parentRefCode}
          </div>
        )}
      </div>

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
        {loading ? '만드는 중...' : '내 공유 링크 만들기'}
      </button>

      {error && (
        <div
          style={{
            marginTop: 16,
            padding: '10px 12px',
            borderRadius: 8,
            background: '#ffe5e5',
            color: '#b00020',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {shareUrl && (
        <div
          style={{
            marginTop: 20,
            padding: '12px 12px',
            borderRadius: 8,
            background: '#f0f9ff',
            fontSize: 13,
          }}
        >
          <div style={{ marginBottom: 6, fontWeight: 600 }}>공유 링크가 생성되었습니다.</div>
          <div
            style={{
              wordBreak: 'break-all',
              padding: '6px 8px',
              borderRadius: 6,
              background: 'white',
              border: '1px solid #cbd5e0',
              marginBottom: 8,
            }}
          >
            {shareUrl}
          </div>
          {hop !== null && (
            <div style={{ marginBottom: 8 }}>
              <strong>hop:</strong> {hop}
            </div>
          )}
          <button
            type="button"
            onClick={handleCopy}
            style={{
              padding: '6px 10px',
              borderRadius: 999,
              border: 'none',
              background: '#3182ce',
              color: 'white',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            링크 복사하기
          </button>
        </div>
      )}
    </div>
  )
}
