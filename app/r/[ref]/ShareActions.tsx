// app/r/[ref]/ShareActions.tsx
"use client";

import { useState } from "react";

type ShareActionsProps = {
  refCode: string;
};

export default function ShareActions({ refCode }: ShareActionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/share/create-child", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ref: refCode }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "서버 오류가 발생했습니다.");
      }

      const data = await res.json();
      if (!data?.ref_code) {
        throw new Error("응답에 ref_code가 없습니다.");
      }

      // 새 링크 페이지로 이동
      window.location.href = `/r/${data.ref_code}`;
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 24 }}>
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          padding: "10px 18px",
          fontSize: 16,
          borderRadius: 6,
          border: "none",
          cursor: loading ? "default" : "pointer",
        }}
      >
        {loading ? "내 링크 만드는 중..." : "내 링크 만들기"}
      </button>
      {error && (
        <p style={{ marginTop: 8, color: "red", fontSize: 14 }}>{error}</p>
      )}
    </div>
  );
}
