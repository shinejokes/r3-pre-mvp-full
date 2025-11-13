// app/lab/share/page.tsx
'use client'

import React, { useState } from 'react'

export default function ShareLabPage() {
  const [originalUrl, setOriginalUrl] = useState('')
  const [title, setTitle] = useState('')
  const [myRefCode, setMyRefCode] = useState<string | null>(null)
  const [myShareUrl, setMyShareUrl] = useState<string | null>(null)

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault()

    // TODO: 나중에 여기에서 Supabase에 message + share 레코드 저장하고
    //       실제 ref_code를 받아오면 됨.
    //       지금은 일단 임시 코드로 시작해 보세.
    const fakeRef = 'TEST1234'

    const base = window.location.origin
    const shareUrl = `${base}/r/${fakeRef}`

    setMyRefCode(fakeRef)
    setMyShareUrl(shareUrl)
  }

  return (
    <main
      style={{
        maxWidth: 600,
        margin: '40px auto',
        padding: '24px',
        border: '1px solid #ddd',
        borderRadius: 16,
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>R3 공유 링크 실험실</h1>
      <p style={{ color: '#555', marginBottom: 24, lineHeight: 1.5 }}>
        보고 싶은 영상이나 글의 원본 URL을 입력하면,
        <br />
        나중에 R3에서 사용할 <strong>“내 공유 링크”</strong>를 만드는
        흐름을 시험해 보는 페이지입니다. (현재는 예시용 가짜 코드)
      </p>

      <form onSubmit={handleGenerate} style={{ display: 'grid', gap: 16 }}>
        <label style={{ display: 'grid', gap: 4 }}>
          <span>메시지 제목 (선택)</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 이 영상 꼭 보세요"
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid #ccc',
            }}
          />
        </label>

        <label style={{ display: 'grid', gap: 4 }}>
          <span>원본 URL</span>
          <input
            type="url"
            required
            value={originalUrl}
            onChange={(e) => setOriginalUrl(e.target.value)}
            placeholder="https://www.youtube.com/..."
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid #ccc',
            }}
          />
        </label>

        <button
          type="submit"
          style={{
            marginTop: 8,
            padding: '10px 14px',
            borderRadius: 999,
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          내 공유 링크 만들기 (예시)
        </button>
      </form>

      {myShareUrl && (
        <section
          style={{
            marginTop: 32,
            paddingTop: 16,
            borderTop: '1px solid #eee',
          }}
        >
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>내 링크 초안</h2>
          <p style={{ marginBottom: 4 }}>
            <strong>ref 코드:</strong> {myRefCode}
          </p>
          <p style={{ marginBottom: 8 }}>
            <strong>공유 URL:</strong>
            <br />
            <code>{myShareUrl}</code>
          </p>
          <p style={{ fontSize: 13, color: '#777' }}>
            * 지금은 예시용 가짜 코드(<code>TEST1234</code>)를 사용합니다.
            <br />
            * 다음 단계에서 이 부분을 Supabase와 연결해서 실제 ref_code를
            발급받도록 바꿀 예정입니다.
          </p>
        </section>
      )}
    </main>
  )
}
