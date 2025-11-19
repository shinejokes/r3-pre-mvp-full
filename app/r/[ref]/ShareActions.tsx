// app/r/[ref]/ShareActions.tsx
"use client";

import { useState, useMemo } from "react";

type ShareActionsProps = {
  refCode?: string; // 있으면 쓰고, 없으면 URL에서 직접 추출
};

export default function ShareActions({ refCode }: ShareActionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 👉 실제로 사용할 ref 값: props가 비어 있으면 URL에서 추출
  const effectiveRef = useMemo(() => {
    if (refCode && refCode.trim().length > 0) {
      return refCode.trim();
    }
    if (typeof window !== "undefined") {
      const path = window.location.pathname; // 예: /r/RCgm2oo
      const parts = path.split("/").filter(Boolean); // ["r", "RCgm2oo"]
      const last = parts[parts.length - 1];
      return last ?? "";
    }
    return "";
  }, [refCode]);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      if (!effectiveRef) {
        throw new Error("URL에서 ref 값을 찾지 못했습니다.");
      }

      const res = await fetch("/api/share/create-child", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ref: effectiveRef }),
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

      {/* 디버그용: 실제로 사용 중인 ref를 아래에 살짝 보여 줌 */}
      <p style={{ marginTop: 8, fontSize: 12, color: "#777" }}>
        사용 중인 ref: <code>{effectiveRef || "(없음)"}</code>
      </p>

      {error && (
        <p style={{ marginTop: 8, color: "red", fontSize: 14 }}>
          {error}
        </p>
      )}
    </div>
  );
}
