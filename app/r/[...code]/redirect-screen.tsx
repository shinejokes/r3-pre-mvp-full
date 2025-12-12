// app/r/[...code]/redirect-screen.tsx
"use client";

import { useState } from "react";

type ShareRow = {
  ref_code: string;
  title: string | null;
  description?: string | null;
  original_url: string | null;
  target_url: string | null;
  views: number | null;
  hop: number | null;
  self_views?: string | null;
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

  const totalViews = share.views ?? 0;
  const myViews = Number(share.self_views ?? 0);
  const currentHop = share.hop ?? 1;
  const hopToDisplay = myHop ?? currentHop;
  const targetUrl = share.target_url || share.original_url || "";

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

  return (
    <main className="r3-page">
      <div className="r3-shell">
        <div className="r3-card">
          {/* 브랜드 */}
          <div className="r3-brand-row">
            <div className="r3-brand">R³ · THE HUMAN NETWORK</div>
          </div>

          {/* 제목 + 설명 */}
          <h1 className="r3-title">{safeTitle}</h1>
          <p className="r3-desc">{share.description ?? " "}</p>

          {/* 통계 */}
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

          {/* 버튼들 */}
          <div className="r3-actions">
            {/* ✅ 첫 번째 버튼: 빨강 + 동일 폭 강제 */}
            <button
              type="button"
              className="r3-action-btn r3-first"
              onClick={handleCreateMyLink}
              disabled={creating}
            >
              {creating ? "링크 만드는 중..." : "내 링크 만들기 (Hop + 1)"}
            </button>

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

            <a
              href={targetUrl}
              className="r3-action-btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              원본 페이지로 바로 이동하기
            </a>

            <a href="/" className="r3-action-btn">
              R3 홈페이지로 이동하기
            </a>
          </div>
        </div>
      </div>

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
          justify-content: flex-start;
          margin-bottom: 12px;
        }

        .r3-brand {
          font-size: 15px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.8);
        }

.r3-title {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;

  /* ✅ 제목은 항상 한 줄만 보이게 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}


.r3-desc {
  margin: 0 0 18px;
  min-height: 20px;
  font-size: 14px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.75);

  /* ✅ 설명은 최대 3줄까지만 보이게 (폰/PC 공통) */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}


/* -------------------------------------------------------
   📊 Views Box – 그라데이션 제거 + 얇은 흰 테두리
-------------------------------------------------------- */
.r3-stats-box {
  display: flex;
  align-items: stretch;
  justify-content: space-between;

  gap: 8px;
  padding: 10px 12px;

  border-radius: 999px;
  background: #0a0f1f;                         /* ★ 단색 */
  border: 1px solid rgba(255,255,255,0.32);    /* ★ 얇은 흰 테두리 */

  margin-bottom: 24px;
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
  gap: 16px;
  margin-top: 10px;
  align-items: center;
}

/* ✅ 세 버튼 모두 완전히 같은 박스가 되도록 강제 */
/* -------------------------------------------------------
   🔥 슬림하고 더 고급스러운 3버튼 스타일
-------------------------------------------------------- */
.r3-actions {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 10px;
  align-items: center;
}

/* 모든 버튼 기본 공통 스타일 */
.r3-action-btn {
  box-sizing: border-box;
  width: 100% !important;
  max-width: 340px !important;

  min-height:14px;          /* ★ 슬림 높이 34 */  
  padding: 6px 6px;         /* ★ 더 낮은 padding 6,14 */ 

  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.40);  

  display: flex !important;
  justify-content: center;
  align-items: center;

  text-align: center;
  text-decoration: none;

  color: #ffffff;
  font-size: 14px;
  font-weight: 600;

  cursor: pointer;
  box-shadow: 0 6px 14px rgba(0,0,0,0.45);
  transition: 0.15s ease;
}

/* hover */
.r3-action-btn:hover {
  filter: brightness(1.10);
}

/* disabled */
.r3-action-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

/* 🔴 첫 번째 버튼: Dark Red */
.r3-first {
  background: #7f1d1d !important;
  border-color: rgba(255,255,255,0.35) !important;
}

/* 🔵 두 번째 버튼: Dark Blue */
.r3-action-btn:nth-of-type(2) {
  background: #1e3a8a !important;
}

/* 🟢 세 번째 버튼: Dark Green */
.r3-action-btn:nth-of-type(3) {
  background: #065f46 !important;
}

        .r3-my-link-box {
          width: 100%;
          max-width: 420px;
          margin-top: -8px;
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
          width: 100%;
          max-width: 420px;
          margin-top: 6px;
          font-size: 12px;
          color: #ff8a80;
          text-align: left;
        }

@media (max-width: 480px) {
  .r3-action-btn {
    font-size: 13px;
    padding: 6px 12px;     /* ✅ 모바일에서도 낮은 높이 유지 */
    min-height: 40px;      /* 선택: 더 얇게 하고 싶으면 줄이기 */
  }
}


          .r3-card {
            padding: 18px 14px 22px;
            border-radius: 20px;
          }

          .r3-brand {
            font-size: 13px;
            letter-spacing: 0.18em;
          }

          .r3-title {
            font-size: 19px;
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
}
