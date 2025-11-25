// app/r/[...code]/redirect-screen.tsx
"use client";

import { useEffect, useState } from "react";

type ShareRow = {
  ref_code: string;
  title: string | null;
  original_url: string | null;
  target_url: string | null;
  views: number | null;
  hop: number | null;
};

interface RedirectScreenProps {
  share: ShareRow;
}

interface CreateLinkResponse {
  ok: boolean;
  shareUrl: string;
  refCode: string;
  hop: number;
  error?: string;
}

export default function RedirectScreen({ share }: RedirectScreenProps) {
  const [countdown, setCountdown] = useState(3);
  const [redirected, setRedirected] = useState(false);

  const [creating, setCreating] = useState(false);
  const [myLink, setMyLink] = useState<string | null>(null);
  const [myHop, setMyHop] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const safeTitle = share.title || "R3 Hand-Forwarded Link";
  const currentViews = share.views ?? 0;
  const currentHop = share.hop ?? 1;
  const targetUrl = share.target_url || share.original_url || "";

  // 자동 리다이렉트
  useEffect(() => {
    if (!targetUrl || redirected) return;
    if (countdown <= 0) {
      setRedirected(true);
      window.location.href = targetUrl;
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, targetUrl, redirected]);

  // “내 링크 만들기” – 새 ref_code, hop+1 생성
  async function handleCreateMyLink() {
    setCreating(true);
    setError(null);
    setCopied(false);

    try {
      const body = {
        originalUrl: share.original_url || share.target_url || "",
        title: share.title,
        targetUrl: share.target_url || share.original_url || "",
        parentRefCode: share.ref_code, // 🔑 부모 share 기준 hop+1
      };

      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data: CreateLinkResponse = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "링크 생성에 실패했습니다.");
      }

      setMyLink(data.shareUrl);
      setMyHop(data.hop);
    } catch (e: any) {
      setError(e?.message ?? "알 수 없는 오류가 발생했습니다.");
    } finally {
      setCreating(false);
    }
  }

  async function handleCopy() {
    if (!myLink) return;
    try {
      await navigator.clipboard.writeText(myLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      style={{
        margin: 0,
        minHeight: "100vh",
        backgroundColor: "#020617",
        color: "#e5e7eb",
        fontFamily: "system-ui, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          maxWidth: 720,
          width: "100%",
          borderRadius: 24,
          border: "1px solid rgba(148,163,184,0.6)",
          padding: "28px 28px 24px 28px",
          background:
            "radial-gradient(circle at top left, #1d2837 0, #020617 55%)",
          boxShadow: "0 18px 40px rgba(0,0,0,0.4)",
        }}
      >
        {/* 상단: 제목 */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 14,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#9ca3af",
              marginBottom: 6,
            }}
          >
            R3 · HAND-FORWARDED LINK
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              lineHeight: 1.3,
            }}
          >
            {safeTitle}
          </div>
        </div>

        {/* 중단: 현재 Views / Hop + 리다이렉트 안내 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 24,
              alignItems: "center",
              justifyContent: "flex-start",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 13,
                  color: "#9ca3af",
                  marginBottom: 4,
                }}
              >
                현재 Views
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                }}
              >
                {currentViews}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 13,
                  color: "#9ca3af",
                  marginBottom: 4,
                }}
              >
                Hop
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                }}
              >
                {currentHop}
              </div>
            </div>
          </div>

          {targetUrl && (
            <div
              style={{
                fontSize: 14,
                color: "#d1d5db",
              }}
            >
              잠시 후 원본 페이지로 이동합니다…{" "}
              <span style={{ fontWeight: 600 }}>
                {countdown > 0 ? `${countdown}초 후` : "이동 중"}
              </span>
            </div>
          )}
        </div>

        {/* “내 링크 만들기” 영역 */}
        <div
          style={{
            borderTop: "1px solid rgba(55,65,81,0.8)",
            paddingTop: 16,
            marginTop: 4,
          }}
        >
          <div
            style={{
              fontSize: 14,
              color: "#9ca3af",
              marginBottom: 8,
            }}
          >
            이 링크가 마음에 들면,{" "}
            <span style={{ color: "#e5e7eb", fontWeight: 600 }}>
              내 R3 링크
            </span>
            를 만들어 친구들에게 직접 전달해 보세요.
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <button
              type="button"
              onClick={handleCreateMyLink}
              disabled={creating}
              style={{
                borderRadius: 999,
                border: "1px solid rgba(59,130,246,0.9)",
                padding: "8px 16px",
                fontSize: 14,
                fontWeight: 600,
                background: creating
                  ? "rgba(37,99,235,0.4)"
                  : "linear-gradient(135deg,#2563eb,#0ea5e9)",
                color: "#f9fafb",
                cursor: creating ? "default" : "pointer",
              }}
            >
              {creating ? "내 링크 만드는 중…" : "내 링크 만들기 (Hop + 1)"}
            </button>

            {myHop !== null && (
              <span
                style={{
                  fontSize: 13,
                  color: "#a5b4fc",
                }}
              >
                새 링크 Hop: {myHop}
              </span>
            )}
          </div>

          {error && (
            <div
              style={{
                fontSize: 13,
                color: "#fecaca",
                marginBottom: 8,
              }}
            >
              {error}
            </div>
          )}

{myLink && (
  <div
    style={{
      marginTop: 4,
      borderRadius: 10,
      border: "1px solid rgba(75,85,99,0.9)",
      padding: "8px 10px",
      fontSize: 13,
      backgroundColor: "rgba(15,23,42,0.9)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    }}
  >
    <div
      style={{
        overflow: "hidden",
        textOverflow: "ellipsis",   // 🔹 여기!
        whiteSpace: "nowrap",
        marginRight: 8,
      }}
    >
      {myLink}
    </div>
    <button
      type="button"
      onClick={handleCopy}
      style={{
        borderRadius: 999,
        border: "1px solid rgba(148,163,184,0.9)",
        padding: "4px 10px",
        fontSize: 12,
        backgroundColor: "transparent",
        color: "#e5e7eb",
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {copied ? "복사됨" : "복사"}
    </button>
  </div>
)}

