// app/r/[...code]/redirect-screen.tsx
"use client";

import { useState } from "react";

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

interface CreateChildResponse {
  ok: boolean;
  url?: string;
  hop?: number;
  ref_code?: string;
  error?: string;
}

export default function RedirectScreen({ share }: RedirectScreenProps) {
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);
  const [myLink, setMyLink] = useState<string | null>(null);
  const [myHop, setMyHop] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const safeTitle = share.title || "R3 Hand-Forwarded Link";
  const currentViews = share.views ?? 0;
  const currentHop = share.hop ?? 1;
  const targetUrl = share.target_url || share.original_url || "";

  // 🔹 "내 링크 만들기" → /api/share-child 호출 (부모 ref_code만 보냄)
  async function handleCreateMyLink() {
    setCreating(true);
    setError(null);
    setCopied(false);

    try {
      const body = {
        parentRefCode: share.ref_code,
      };

      const res = await fetch("/api/share-child", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data: CreateChildResponse = await res.json();

      if (!res.ok || !data.ok || !data.url) {
        throw new Error(data.error || "링크 생성에 실패했습니다.");
      }

      setMyLink(data.url);
      setMyHop(data.hop ?? currentHop + 1);
      setCreated(true);
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

        {/* 중단: 현재 Views / Hop */}
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

          {!created && (
            <div
              style={{
                fontSize: 14,
                color: "#d1d5db",
              }}
            >
              이 링크는 <strong>R3 중간 전달 링크</strong>입니다. 아래 버튼을
              눌러 <strong>내 R3 링크</strong>를 만들고, 그 링크를 친구들에게
              직접 전달해 보세요.
            </div>
          )}

          {created && (
            <div
              style={{
                fontSize: 14,
                color: "#a5b4fc",
              }}
            >
              ✅ <strong>중간 전달자 등록이 완료되었습니다.</strong>{" "}
              아래에 만들어진{" "}
              <span style={{ fontWeight: 600 }}>내 R3 링크</span>를 복사해
              카카오톡에 붙여 넣어 보세요.
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
          {!created && (
            <ol
              style={{
                fontSize: 13,
                color: "#9ca3af",
                paddingLeft: 18,
                marginBottom: 10,
              }}
            >
              <li>아래 버튼을 눌러 내 링크를 만듭니다.</li>
              <li>
                생성된 링크를 <strong>복사</strong>해서 카카오톡에 붙여
                넣습니다.
              </li>
            </ol>
          )}

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
              disabled={creating || created}
              style={{
                borderRadius: 999,
                border: "1px solid rgba(59,130,246,0.9)",
                padding: "8px 16px",
                fontSize: 14,
                fontWeight: 600,
                background:
                  creating || created
                    ? "rgba(37,99,235,0.4)"
                    : "linear-gradient(135deg,#2563eb,#0ea5e9)",
                color: "#f9fafb",
                cursor: creating || created ? "default" : "pointer",
              }}
            >
              {creating
                ? "내 링크 만드는 중…"
                : created
                ? "내 링크가 만들어졌습니다"
                : "내 링크 만들기 (Hop + 1)"}
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
                  textOverflow: "ellipsis",
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

          {/* 원본으로 이동 버튼 */}
          {targetUrl && (
            <div
              style={{
                marginTop: 14,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <a
                href={targetUrl}
                style={{
                  fontSize: 12,
                  color: "#9ca3af",
                  textDecoration: "underline",
                }}
              >
                원본 페이지로 바로 이동하기
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
