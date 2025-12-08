// app/r/[...code]/redirect-screen.tsx
"use client";

import { useState } from "react";

type ShareRow = {
  ref_code: string;
  title: string | null;
  description?: string | null;  // ✅ description 추가
  original_url: string | null;
  target_url: string | null;
  views: number | null;          // 전체 조회수(원본 기준)
  hop: number | null;
  self_views?: number | null;    // 내 링크 조회수
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
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);
  const [myLink, setMyLink] = useState<string | null>(null);
  const [myHop, setMyHop] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const safeTitle = share.title || "R³ Hand-Forwarded Link";

  // 전체 조회수 (원본 기준)
  const totalViews = share.views ?? 0;

  // 내 링크 조회수
  const myViews = share.self_views ?? 0;

  const currentHop = share.hop ?? 1;
  const hopToDisplay = myHop ?? currentHop;   // ✅ 화면에 보여줄 Hop
  const targetUrl = share.target_url || share.original_url || "";

  // “내 링크 만들기” – 부모 ref_code를 보내서 child share 생성
  async function handleCreateMyLink() {
    setCreating(true);
    setError(null);
    setCopied(false);

    try {
      const res = await fetch("/api/share-child", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentRefCode: share.ref_code,
        }),
      });

      const data: CreateLinkResponse = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "링크 생성에 실패했습니다.");
      }

      setMyLink(data.shareUrl);
      setMyHop(data.hop);
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

  // ----------------- 여기부터 화면 레이아웃 -----------------
  return (
    <main className="r3-page">
      <div className="r3-shell">
        <div className="r3-card">
          {/* 0. 브랜드 + 홈 링크 (한 줄에 나오도록) */}
          <div className="r3-brand-row">
            <div className="r3-brand">R³ · THE HUMAN NETWORK</div>
            <a href="/" className="r3-home-link">
              R3 홈페이지로 →
            </a>
          </div>

          {/* 1. 제목 + description */}
          <h1 className="r3-title">{safeTitle}</h1>
          {share.description && (
            <p className="r3-desc">{share.description}</p>
          )}

          {/* 2. Views / My Views / Hop 한 박스 */}
          <div className="r3-stats-box">
            <div className="r3-stat">
              <span className="r3-stat-label">Views</span>
              <span className="r3-stat-value">{totalViews}</span>
            </div>
            <div className="r3-stat">
              <span className="r3-stat-label">My Views</span>
              <span className="r3-stat-value">{myViews}</span>
            </div>
            <div className="r3-stat">
              <span className="r3-stat-label">Hop</span>
              <span className="r3-stat-value">{hopToDisplay}</span>
            </div>
          </div>

          {/* 3. 버튼 3개 세로 배치 */}
          <div className="r3-actions">
            {/* (1) 내 링크 만들기 (Hop+1) */}
            <button
              type="button"
              className="r3-action-btn r3-primary"
              onClick={handleCreateMyLink}
              disabled={creating}
            >
              {creating ? "링크 만드는 중..." : "내 링크 만들기 (Hop + 1)"}
            </button>

            {/* 새로 만들어진 링크가 있으면 코피 버튼/표시 */}
            {created && myLink && (
              <div className="r3-my-link-box">
                <div className="r3-my-link-url">{myLink}</div>
                <button
                  type="button"
                  className="r3-copy-btn"
                  onClick={handleCopy}
                >
                  {copied ? "복사됨!" : "링크 복사"}
                </button>
              </div>
            )}

            {error && <div className="r3-error">{error}</div>}

            {/* (2) 원본 페이지로 바로 이동하기 */}
            <a
              href={targetUrl}
              className="r3-action-btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              원본 페이지로 바로 이동하기
            </a>

            {/* (3) R3 홈페이지로 이동 */}
            <a href="/" className="r3-action-btn">
              R3 홈페이지로 이동하기
            </a>
          </div>
        </div>
      </div>

      {/* styled-jsx: 반응형 레이아웃 */}
      <style jsx>{`
        .r3-page {
          min-height: 100vh;
          margin: 0;
          padding: 24px 12px;
          background: radial-gradient(circle at top, #151a2f, #050816);
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }

        .r3-shell {
          width: 100%;
          max-width: 960px;
        }

        .r3-card {
          background: rgba(5, 10, 25, 0.9);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow: 0 18px 60px rgba(0, 0, 0, 0.55);
          padding: 24px 20px 28px;
        }

        .r3-brand-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
          white-space: nowrap;
        }

        .r3-brand {
          font-size: 13px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.7);
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .r3-home-link {
          font-size: 12px;
          color: rgba(144, 202, 249, 0.9);
          text-decoration: none;
          flex-shrink: 0;
        }

        .r3-home-link:hover {
          text-decoration: underline;
        }

        .r3-title {
          margin: 0 0 6px;
          font-size: 22px;
          font-weight: 700;
          color: #ffffff;
        }

        .r3-desc {
          margin: 0 0 18px;
          font-size: 14px;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.75);
        }

        .r3-stats-box {
          display: flex;
          align-items: stretch;
          justify-content: space-between;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 999px;
          background: radial-gradient(circle at top left, #18263f, #050816);
          border: 1px solid rgba(255, 255, 255, 0.06);
          margin-bottom: 20px;
        }

        .r3-stat {
          flex: 1 1 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.7);
        }

        .r3-stat-label {
          margin-bottom: 2px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .r3-stat-value {
          font-size: 15px;
          font-weight: 600;
          color: #ffffff;
        }

        .r3-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 10px;
        }

        .r3-action-btn {
          width: 100%;
          text-align: center;
          padding: 12px 16px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(18, 27, 63, 0.9);
          color: #ffffff;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .r3-action-btn:hover {
          filter: brightness(1.1);
        }

        .r3-primary {
          border-color: rgba(129, 212, 250, 0.5);
          box-shadow: 0 0 16px rgba(129, 212, 250, 0.4);
        }

        .r3-my-link-box {
          margin-top: 6px;
          margin-bottom: 4px;
          padding: 10px 12px;
          border-radius: 16px;
          background: rgba(10, 15, 40, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.12);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .r3-my-link-url {
          font-size: 12px;
          word-break: break-all;
          color: rgba(255, 255, 255, 0.8);
        }

        .r3-copy-btn {
          align-self: flex-end;
          padding: 6px 10px;
          border-radius: 999px;
          border: none;
          background: rgba(129, 212, 250, 0.2);
          color: #e3f2fd;
          font-size: 12px;
          cursor: pointer;
        }

        .r3-error {
          margin-top: 6px;
          font-size: 12px;
          color: #ff8a80;
        }

        @media (max-width: 480px) {
          .r3-page {
            padding: 16px 10px;
          }

          .r3-card {
            padding: 18px 14px 22px;
            border-radius: 20px;
          }

          .r3-brand {
            font-size: 11px;
            letter-spacing: 0.16em;
          }

          .r3-title {
            font-size: 18px;
          }

          .r3-desc {
            font-size: 13px;
          }

          .r3-stats-box {
            padding: 8px 10px;
          }

          .r3-stat-value {
            font-size: 14px;
          }

          .r3-action-btn {
            font-size: 13px;
            padding: 11px 12px;
          }
        }

        @media (min-width: 960px) {
          .r3-card {
            padding: 28px 32px 32px;
          }
          .r3-title {
            font-size: 26px;
          }
          .r3-desc {
            font-size: 15px;
          }
        }
      `}</style>
    </main>
  );
}  // ✅ 마지막에 함수 닫는 중괄호
