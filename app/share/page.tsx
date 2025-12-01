// app/share/page.tsx
"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function SharePage() {
  const searchParams = useSearchParams();

  const initialMessageId = (searchParams?.get("messageId") as string) || "";
  const parentRefCode = searchParams?.get("parentRefCode") || "";

  const [messageId, setMessageId] = useState(initialMessageId);
  const [sharerName, setSharerName] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [hop, setHop] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateShare = async () => {
    setLoading(true);
    setError(null);
    setShareUrl(null);

    const trimmedMessageId = messageId.trim();
    if (!trimmedMessageId) {
      setError("메시지 ID를 입력해 주세요.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/create-share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageId: trimmedMessageId,
          parentRefCode: parentRefCode || null,
          sharerName: sharerName.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || "공유 링크 생성에 실패했습니다.");
        setLoading(false);
        return;
      }

      // 배포 도메인 기준으로 R3 링크 구성
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const url = `${origin}/r/${data.refCode}`;

      setShareUrl(url);
      setHop(data.hop ?? null);
    } catch (e) {
      console.error(e);
      setError("서버 통신 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("링크를 클립보드에 복사했습니다.");
    } catch {
      alert("복사에 실패했습니다. 직접 선택해서 복사해 주세요.");
    }
  };

  return (
    <div
      style={{
        maxWidth: 480,
        margin: "40px auto",
        padding: "24px",
        borderRadius: 16,
        border: "1px solid #ddd",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>내 링크 만들기</h1>

      <div
        style={{
          fontSize: 13,
          color: "#4a5568",
          marginBottom: 16,
          lineHeight: 1.5,
        }}
      >
        원본 메시지 ID(또는 URL의 일부)를 입력하고, 필요하면 내 이름을
        남겨보세요.
        <br />
        <strong>만들기</strong>를 누르면 새로운 R3 공유 링크가 생성됩니다.
      </div>

      <label
        style={{
          display: "block",
          fontSize: 13,
          marginBottom: 4,
        }}
      >
        메시지 ID
      </label>
      <input
        value={messageId}
        onChange={(e) => setMessageId(e.target.value)}
        placeholder="예: c5b09f2e-9ad9-4194-b15c-91c36330e224"
        style={{
          width: "100%",
          padding: "8px 10px",
          borderRadius: 8,
          border: "1px solid #ccc",
          marginBottom: 12,
          fontSize: 14,
        }}
      />

      <label
        style={{
          display: "block",
          fontSize: 13,
          marginBottom: 4,
        }}
      >
        내 이름 (선택)
      </label>
      <input
        value={sharerName}
        onChange={(e) => setSharerName(e.target.value)}
        placeholder="예: 홍길동"
        style={{
          width: "100%",
          padding: "8px 10px",
          borderRadius: 8,
          border: "1px solid #ccc",
          marginBottom: 16,
          fontSize: 14,
        }}
      />

      {parentRefCode && (
        <div
          style={{
            fontSize: 12,
            color: "#718096",
            marginBottom: 16,
          }}
        >
          부모 링크 코드: <code>{parentRefCode}</code>
        </div>
      )}

      {error && (
        <div
          style={{
            marginBottom: 12,
            padding: "8px 10px",
            borderRadius: 8,
            background: "#fed7d7",
            color: "#742a2a",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleCreateShare}
        disabled={loading}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 999,
          border: "none",
          background: "#3182ce",
          color: "white",
          fontSize: 15,
          fontWeight: 600,
          cursor: loading ? "default" : "pointer",
        }}
      >
        {loading ? "만드는 중..." : "만들기"}
      </button>

      {shareUrl && (
        <div
          style={{
            marginTop: 20,
            padding: "12px 12px 10px",
            borderRadius: 12,
            border: "1px solid #cbd5e0",
            background: "#f7fafc",
            fontSize: 13,
          }}
        >
          <div style={{ marginBottom: 6, fontWeight: 600 }}>
            생성된 R3 링크
          </div>
          <div
            style={{
              wordBreak: "break-all",
              marginBottom: 8,
              color: "#2d3748",
            }}
          >
            {shareUrl}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 12, color: "#4a5568" }}>
              Hop: {hop ?? "-"}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                border: "none",
                background: "#3182ce",
                color: "white",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              링크 복사하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
