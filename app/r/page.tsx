"use client";

import React, { useState, FormEvent } from "react";

export default function RegisterMessagePage() {
  const [title, setTitle] = useState("");
  const [originalUrl, setOriginalUrl] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copyDone, setCopyDone] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!originalUrl.trim()) {
      alert("원본 URL을 입력해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          originalUrl,
          description, // ✅ 설명도 함께 전송
        }),
      });

      const data = await res.json();

      if (!res.ok || data.ok === false) {
        alert(`등록 실패: ${data.error ?? "알 수 없는 오류"}`);
        return;
      }

      if (!data.shareUrl) {
        console.error("No shareUrl in response", data);
        alert("등록은 되었지만 shareUrl이 반환되지 않았습니다.");
        return;
      }

      setShareUrl(data.shareUrl);
      setCopyDone(false);

      // 폼 초기화
      setTitle("");
      setOriginalUrl("");
      setDescription("");
    } catch (err) {
      console.error(err);
      alert("등록 중 알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setCopyDone(true);
      } else {
        window.prompt("아래 링크를 복사해 주세요.", shareUrl);
      }
    } catch (e) {
      console.error(e);
      alert("클립보드 복사에 실패했습니다. 직접 복사해 주세요.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#020617", // ✅ 다크 블루 배경
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
          boxShadow: "0 10px 25px rgba(15, 23, 42, 0.45)",
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

        {/* 제목 입력 */}
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
            maxLength={60} // ✅ 한 줄 정도 분량 (폰 기준)으로 제한
            style={{
              marginTop: "6px",
              width: "100%",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
            }}
            placeholder="동영상이나 글의 제목을 적어 주세요 (한 줄)"
          />
        </label>

        {/* 원본 URL 입력 */}
        <label
          style={{
            display: "block",
            marginBottom: "16px",
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
            placeholder="https:// 로 시작하는 원본 링크"
          />
        </label>

        {/* 설명 입력칸 */}
        <label
          style={{
            display: "block",
            marginBottom: "24px",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          설명 (선택, 폰 기준 3줄 이내):
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={180} // ✅ 3줄 정도 분량으로 대략 제한
            style={{
              marginTop: "6px",
              width: "100%",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              minHeight: "80px",
              resize: "vertical",
            }}
            placeholder="예: 이 영상은 서곡의 ‘내 안의 당신’입니다. (폰에서 3줄 이내로 보이도록 짧게)"
          />
        </label>

        {/* 제출 버튼 */}
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

        {/* 등록 후 공유 링크 박스 */}
        {shareUrl && (
          <div
            style={{
              marginTop: "24px",
              padding: "16px",
              borderRadius: "12px",
              backgroundColor: "#fff7e6",
              border: "1px solid #f0c36d",
            }}
          >
            <div
              style={{
                marginBottom: "8px",
                fontWeight: 600,
                fontSize: "15px",
              }}
            >
              등록 완료! 🎉
            </div>
            <div
              style={{
                marginBottom: "8px",
                fontSize: "14px",
              }}
            >
              아래 링크를 카톡방에 붙여 넣어 보세요.
            </div>
            <div
              style={{
                padding: "8px 10px",
                borderRadius: "8px",
                backgroundColor: "white",
                border: "1px solid #ddd",
                fontSize: "13px",
                wordBreak: "break-all",
                marginBottom: "8px",
              }}
            >
              {shareUrl}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              style={{
                padding: "6px 12px",
                borderRadius: "999px",
                border: "none",
                backgroundColor: "#a66b1f",
                color: "white",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              링크 복사
            </button>
            {copyDone && (
              <span
                style={{
                  marginLeft: "8px",
                  fontSize: "12px",
                  color: "#666",
                }}
              >
                복사되었습니다!
              </span>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
