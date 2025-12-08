// app/create/page.tsx
"use client";

import React, { useState } from "react";

type CreateShareResponse =
  | {
      shareUrl: string;
      ref: string;
      messageId: number;
    }
  | {
      error: string;
    };

export default function CreateSharePage() {
  const [title, setTitle] = useState("");
  const [originalUrl, setOriginalUrl] = useState("");
  const [description, setDescription] = useState(""); // 🆕 설명 상태
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [refCode, setRefCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResultUrl(null);
    setRefCode(null);

 if (!title.trim()) {
    setError("제목을 입력해 주세요.");
    return;
  }

    if (!originalUrl.trim()) {
      setError("원본 URL을 입력해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/create-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || null,
          originalUrl: originalUrl.trim(),
          // 🆕 설명도 함께 전송 (선택 사항)
          description: description.trim() || null,
        }),
      });

      const json: CreateShareResponse = await res.json();

      if (!res.ok || "error" in json) {
        setError(
          json && "error" in json ? json.error : "서버 오류가 발생했습니다."
        );
        return;
      }

      setResultUrl(json.shareUrl);
      setRefCode(json.ref);
    } catch (err) {
      console.error(err);
      setError("요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (resultUrl) {
      navigator.clipboard
        .writeText(resultUrl)
        .catch((err) => console.error("클립보드 복사 실패:", err));
    }
  }

  return (
    <main
      style={{
        maxWidth: 600,
        margin: "40px auto",
        padding: "24px",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        border: "1px solid #ddd",
        borderRadius: 12,
      }}
    >
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>R3 공유 링크 만들기</h1>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        {/* 제목 (선택) */}
<label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
  <span>제목 (필수)</span>
  <input
    type="text"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    placeholder="예: 이 영상 꼭 보세요"
    required
    style={{
      padding: "8px 10px",
      borderRadius: 6,
      border: "1px solid #ccc",
    }}
  />
</label>


        {/* 🆕 설명 (선택) */}
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span>설명 (선택)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="콘텐츠에 대한 간단한 설명을 입력하세요. (선택사항)"
            style={{
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid #ccc",
              minHeight: 80,
              resize: "vertical",
            }}
          />
        </label>

        {/* 원본 URL (필수) */}
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span>원본 URL (필수)</span>
          <input
            type="url"
            value={originalUrl}
            onChange={(e) => setOriginalUrl(e.target.value)}
            placeholder="https://www.youtube.com/..."
            required
            style={{
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid #ccc",
            }}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 8,
            padding: "10px 14px",
            borderRadius: 8,
            border: "none",
            backgroundColor: "#2563eb",
            color: "white",
            fontSize: 16,
            cursor: loading ? "default" : "pointer",
          }}
        >
          {loading ? "생성 중..." : "공유 링크 만들기"}
        </button>
      </form>

      {error && (
        <p style={{ marginTop: 16, color: "crimson" }}>오류: {error}</p>
      )}

      {resultUrl && (
        <section
          style={{
            marginTop: 24,
            padding: 16,
            borderRadius: 8,
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>생성된 공유 링크</h2>
          {refCode && (
            <p style={{ marginBottom: 4, color: "#666" }}>
              ref 코드: <code>{refCode}</code>
            </p>
          )}
          <p
            style={{
              wordBreak: "break-all",
              marginBottom: 8,
            }}
          >
            <a href={resultUrl} target="_blank" rel="noreferrer">
              {resultUrl}
            </a>
          </p>
          <button
            type="button"
            onClick={handleCopy}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #d1d5db",
              backgroundColor: "white",
              cursor: "pointer",
            }}
          >
            링크 복사하기
          </button>
          <p
            style={{
              marginTop: 8,
              fontSize: 13,
              color: "#6b7280",
            }}
          >
            이 링크를 카카오톡 방에 붙여넣으면 지금처럼 R3 썸네일 카드가
            표시됩니다.
          </p>
        </section>
      )}
    </main>
  );
}
