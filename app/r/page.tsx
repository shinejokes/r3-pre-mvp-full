// app/r/page.tsx
"use client";

import { useState } from "react";

export default function RegisterMessagePage() {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultLink, setResultLink] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setResultLink(null);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, url }),
      });

      const json = await res.json();
      if (json?.shareUrl) {
        setResultLink(json.shareUrl);
      } else {
        alert("등록은 되었지만 shareUrl이 반환되지 않았습니다.");
      }
    } catch (e) {
      alert("오류 발생: " + (e as any).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>📨 메시지 등록</h1>
      <div style={{ marginTop: 20 }}>
        <label>제목:</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ width: "100%", padding: 8, marginTop: 4 }}
          placeholder="예: 멋진 유튜브 영상"
        />
      </div>

      <div style={{ marginTop: 20 }}>
        <label>원본 URL:</label>
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          style={{ width: "100%", padding: 8, marginTop: 4 }}
          placeholder="https://youtube.com/..."
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          marginTop: 30,
          padding: "12px 20px",
          background: "#333",
          color: "white",
          border: "none",
          cursor: "pointer",
          width: "100%",
        }}
      >
        {loading ? "등록 중…" : "메시지 등록하기"}
      </button>

      {resultLink && (
        <div style={{ marginTop: 30, padding: 20, background: "#f0f0f0" }}>
          <h3>✅ 등록 완료!</h3>
          <p>아래 링크를 누르면 hop=1 링크가 생성된 것입니다.</p>
          <a href={resultLink} style={{ color: "blue" }}>
            {resultLink}
          </a>
        </div>
      )}
    </div>
  );
}
