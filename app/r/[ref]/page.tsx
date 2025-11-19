// app/r/[ref]/page.tsx
"use client";

import { useEffect, useState } from "react";

type PageParams = {
  ref?: string;
  ref_code?: string;
  shareId?: string;
  [key: string]: string | undefined;
};

type PageProps = {
  params: PageParams;
};

export default function ShareLandingPage({ params }: PageProps) {
  const [parentRef, setParentRef] = useState<string>("");

  useEffect(() => {
    const fromParams =
      params.ref ||
      params.ref_code ||
      params.shareId ||
      Object.values(params).find((v) => typeof v === "string");

    if (fromParams) {
      setParentRef(fromParams);
      return;
    }

    if (typeof window !== "undefined") {
      const parts = window.location.pathname.split("/").filter(Boolean);
      const last = parts[parts.length - 1];
      if (last) setParentRef(last);
    }
  }, [params]);

  const [loading, setLoading] = useState(false);
  const [myLink, setMyLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hop, setHop] = useState<number | null>(null);

  async function handleMakeMyLink() {
    try {
      setLoading(true);
      setError(null);

      if (!parentRef) {
        throw new Error("원본 링크 코드(parentRef)를 찾을 수 없습니다.");
      }

      const res = await fetch("/api/share-child", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentRef }),
      });

      if (!res.ok) {
        throw new Error(`서버 오류 (status ${res.status})`);
      }

      const data = await res.json();
      console.log("share-child response:", data);

      // 서버가 무엇을 주든, ref_code만 받아서 Vercel 도메인으로 직접 조합
      const refFromApi: string | undefined =
        data.ref_code || data.ref || data.shareRef;

      if (!refFromApi) {
        throw new Error("서버에서 ref_code를 받지 못했습니다.");
      }

      const finalUrl = `https://r3-pre-mvp-full.vercel.app/r/${refFromApi}`;

      setMyLink(finalUrl);
      if (typeof data.hop === "number") {
        setHop(data.hop);
      }
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
      .catch((e) => console.error("Clipboard error:", e));
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px 16px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f5f5",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "640px",
          background: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          padding: "24px 24px 28px",
        }}
      >
        <h1
          style={{
            fontSize: "24px",
            marginBottom: "8px",
            fontWeight: 700,
          }}
        >
          R3: 내 링크 만들기
        </h1>

        <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
          이 페이지는{" "}
          <code
            style={{
              padding: "2px 6px",
              borderRadius: "4px",
              background: "#f0f0f0",
              fontSize: "12px",
            }}
          >
            {parentRef || "알 수 없는"}
          </code>{" "}
          링크를 통해 들어온 화면입니다.
        </p>
        <p style={{ marginTop: "6px", color: "#666", fontSize: "14px" }}>
          아래 버튼을 누르면, 이 링크를 한 번 더 전달하기 위한{" "}
          <strong>나만의 링크</strong>가 만들어지고, hop 값이 1 증가합니다.
        </p>

        <hr style={{ margin: "16px 0 20px", borderColor: "#eee" }} />

        <button
          onClick={handleMakeMyLink}
          disabled={loading || !parentRef}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: "10px",
            border: "none",
            fontSize: "16px",
            fontWeight: 600,
            cursor: loading || !parentRef ? "default" : "pointer",
            background: loading || !parentRef ? "#bbbbbb" : "#0070f3",
            color: "#ffffff",
          }}
        >
          {loading
            ? "링크 생성 중..."
            : parentRef
            ? "내 링크 만들기"
            : "원본 코드 확인 중..."}
        </button>

        {error && (
          <p
            style={{
              marginTop: "12px",
              color: "#d00",
              fontSize: "14px",
              whiteSpace: "pre-wrap",
            }}
          >
            {error}
          </p>
        )}

        {myLink && (
          <div
            style={{
              marginTop: "20px",
              padding: "12px",
              borderRadius: "10px",
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
            }}
          >
            <p style={{ margin: "0 0 6px", fontSize: "14px", color: "#444" }}>
              아래 링크를 카카오톡 방에 붙여넣으면,
              {hop !== null && (
                <>
                  {" "}
                  이 링크는 <strong>hop {hop}</strong> 으로 기록됩니다.
                </>
              )}
            </p>
            <input
              value={myLink}
              readOnly
              onFocus={(e) => e.target.select()}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                fontSize: "13px",
                fontFamily: "monospace",
                boxSizing: "border-box",
              }}
            />
            <div style={{ marginTop: "8px", textAlign: "right" }}>
              <button
                type="button"
                onClick={handleCopy}
                style={{
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  background: "#ffffff",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                링크 복사
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
