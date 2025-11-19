// app/r/[ref]/ShareClient.tsx
"use client";

import { useState } from "react";

type Props = {
  parentRef: string;
  hop: number;
  originUrl?: string;
  title: string;
};

export default function ShareClient({ parentRef, hop, originUrl, title }: Props) {
  const [loading, setLoading] = useState(false);
  const [myLink, setMyLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newHop, setNewHop] = useState<number | null>(null);

  async function handleMakeMyLink() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/share-child", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentRef }),
      });

      if (!res.ok) {
        throw new Error(`서버 오류 (status ${res.status})`);
      }

      const data = await res.json();
      const refFromApi: string | undefined =
        data.ref_code || data.ref || data.shareRef;

      if (!refFromApi) {
        throw new Error("서버에서 ref_code를 받지 못했습니다.");
      }

      const finalUrl = `https://r3-pre-mvp-full.vercel.app/r/${refFromApi}`;

      setMyLink(finalUrl);
      if (typeof data.hop === "number") setNewHop(data.hop);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!myLink) return;
    navigator.clipboard
      .writeText(myLink)
      .catch((e) => console.error("clipboard error:", e));
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "700px",
        background: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
        padding: "24px 24px 28px",
      }}
    >
      <h1 style={{ fontSize: 24, marginBottom: 8, fontWeight: 700 }}>
        R3: 내 링크 만들기
      </h1>
      <p style={{ margin: 0, color: "#666", fontSize: 14 }}>
        이 페이지는{" "}
        <code
          style={{
            padding: "2px 6px",
            borderRadius: "4px",
            background: "#f0f0f0",
            fontSize: 12,
          }}
        >
          {parentRef}
        </code>{" "}
        링크를 통해 들어온 화면입니다.
      </p>
      <p style={{ marginTop: 6, color: "#666", fontSize: 14 }}>
        아래 버튼을 누르면, 이 링크를 한 번 더 전달하기 위한{" "}
        <strong>나만의 링크</strong>가 만들어지고, hop 값이 1 증가합니다.
      </p>

      {originUrl && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 10,
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
          }}
        >
          <p style={{ margin: "0 0 8px", fontSize: 14, color: "#444" }}>
            이 링크의 원본 콘텐츠:
          </p>
          <a
            href={originUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 14, color: "#0366d6", wordBreak: "break-all" }}
          >
            {title || originUrl}
          </a>
          <div style={{ marginTop: 8 }}>
            <a
              href={originUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 13,
                textDecoration: "none",
              }}
            >
              원본으로 이동
            </a>
          </div>
        </div>
      )}

      <hr style={{ margin: "18px 0 20px", borderColor: "#eee" }} />

      <button
        onClick={handleMakeMyLink}
        disabled={loading}
        style={{
          width: "100%",
          padding: "12px 16px",
          borderRadius: "10px",
          border: "none",
          fontSize: "16px",
          fontWeight: 600,
          cursor: loading ? "default" : "pointer",
          background: loading ? "#bbbbbb" : "#0070f3",
          color: "#ffffff",
        }}
      >
        {loading ? "링크 생성 중..." : "내 링크 만들기"}
      </button>

      {error && (
        <p
          style={{
            marginTop: 12,
            color: "#d00",
            fontSize: 14,
            whiteSpace: "pre-wrap",
          }}
        >
          {error}
        </p>
      )}

      {myLink && (
        <div
          style={{
            marginTop: 20,
            padding: 12,
            borderRadius: 10,
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
          }}
        >
          <p style={{ margin: "0 0 6px", fontSize: 14, color: "#444" }}>
            아래 링크를 카카오톡 방에 붙여넣으면, 이 링크는{" "}
            <strong>hop {newHop ?? hop + 1}</strong> 으로 기록됩니다.
          </p>
          <input
            value={myLink}
            readOnly
            onFocus={(e) => e.target.select()}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid #d1d5db",
              fontSize: 13,
              fontFamily: "monospace",
              boxSizing: "border-box",
            }}
          />
          <div style={{ marginTop: 8, textAlign: "right" }}>
            <button
              type="button"
              onClick={handleCopy}
              style={{
                padding: "6px 10px",
                borderRadius: 6,
                border: "1px solid #d1d5db",
                background: "#ffffff",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              링크 복사
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
