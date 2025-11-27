// app/r/page.tsx
"use client";

import { useState } from "react";

export default function RegisterMessagePage() {
  const [title, setTitle] = useState("");
  const [originalUrl, setOriginalUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!originalUrl.trim()) {
      alert("원본 URL을 입력해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          originalUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(`등록 실패: ${data.error ?? "알 수 없는 오류"}`);
        return;
      }

      if (!data.shareUrl) {
        console.error("No shareUrl in response", data);
        alert("등록은 되었지만 shareUrl이 반환되지 않았습니다.");
        return;
      }

      // ✅ 정상적으로 shareUrl을 받은 경우
      alert(
        `등록 완료!\n\n아래 링크를 카톡방에 붙여 넣어 보세요.\n\n${data.shareUrl}`
      );

      // 폼 초기화
      setTitle("");
      setOriginalUrl("");
    } catch (err) {
      console.error(err);
      alert("등록 중 알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        paddingTop: "80px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: "640px",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 10px 25px rgba(15, 23, 42, 0.12)",
          padding: "32px",
        }}
      >
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 700,
            marginBottom: "24px",
            textAlign: "center",
          }}
        >
          ✉️ 메시지 등록
        </h1>

        <label
          style={{
            display: "block",
            marginBottom: "16px",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          제목:
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              marginTop: "6px",
              width: "100%",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
            }}
            placeholder="동영상이나 글의 제목을 적어 주세요"
          />
        </label>

        <label
          style={{
            display: "block",
            marginBottom: "24px",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          원본 URL:
          <input
            type="text"
            value={originalUrl}
            onChange={(e) => setOriginalUrl(e.target.value)}
            style={{
              marginTop: "6px",
              width: "100%",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
            }}
            placeholder="https:// 로 시작하는 원본 링크를 붙여 넣어 주세요"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: loading ? "#6b7280" : "#111827",
            color: "#ffffff",
            fontSize: "16px",
            fontWeight: 600,
            cursor: loading ? "default" : "pointer",
          }}
        >
          {loading ? "등록 중..." : "메시지 등록하기"}
        </button>
      </form>
    </div>
  );
}
