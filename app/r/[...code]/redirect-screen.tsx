"use client";

import { useState } from "react";

type ShareInfo = {
  ref_code: string;
  title: string | null;
  description: string | null;
  target_url: string | null;
  original_url: string | null;
  views: number | null;
  myViews?: number | null;
  hop: number | null;
  totalViews?: number | null;
};

export default function RedirectScreen({ share }: { share: ShareInfo }) {
  const {
    ref_code,
    title,
    description,
    target_url,
    original_url,
    views,
    myViews,
    hop,
  } = share;

  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);
  const [myLink, setMyLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateMyLink = async () => {
    try {
      setCreating(true);
      setError(null);

      const res = await fetch("/api/create-my-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parent_ref_code: ref_code }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "링크 생성 실패");

      setMyLink(data.url);
      setCreated(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!myLink) return;
    await navigator.clipboard.writeText(myLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="r3-wrap">
      <div className="r3-card">
        <div className="r3-title">{title}</div>

        <div className="r3-desc">
          {description}
        </div>

        <div className="r3-stats">
          <div>
            <div className="label">VIEWS</div>
            <div className="value">{views ?? 0}</div>
          </div>
          <div>
            <div className="label">MY VIEWS</div>
            <div className="value">{myViews ?? 0}</div>
          </div>
          <div>
            <div className="label">HOP</div>
            <div className="value">{hop ?? 0}</div>
          </div>
        </div>

        {/* 🔘 Buttons */}
        <div className="r3-actions">
          {/* 1) 원본 페이지 */}
          {target_url && (
            <a
              href={target_url}
              className="r3-action-btn r3-btn-blue"
              target="_blank"
              rel="noopener noreferrer"
            >
              원본 페이지로 바로 이동하기
            </a>
          )}

          {/* 2) R3 홈 */}
          <a href="/" className="r3-action-btn r3-btn-green">
            R3 홈페이지로 이동하기
          </a>

          {/* 3) 내 링크 만들기 */}
          <button
            type="button"
            className="r3-action-btn r3-btn-red"
            onClick={handleCreateMyLink}
            disabled={creating}
          >
            {creating ? "링크 만드는 중..." : "내 링크 만들기 (Hop + 1)"}
          </button>

          {created && myLink && (
            <div className="r3-my-link-box">
              <div className="r3-my-link-url">{myLink}</div>
              <button className="r3-copy-btn" onClick={handleCopy}>
                {copied ? "복사됨!" : "링크 복사"}
              </button>
            </div>
          )}

          {error && <div className="r3-error">{error}</div>}
        </div>
      </div>

      {/* CSS */}
      <style jsx>{`
        .r3-wrap {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: radial-gradient(circle at top, #0b1224, #020617);
          padding: 20px;
        }

        .r3-card {
          width: 100%;
          max-width: 420px;
          background: rgba(8, 12, 28, 0.95);
          border-radius: 28px;
          padding: 26px 22px 30px;
          box-shadow: 0 40px 80px rgba(0, 0, 0, 0.55);
          color: white;
        }

        .r3-title {
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 10px;
        }

        .r3-desc {
          font-size: 14px;
          line-height: 1.5;
          opacity: 0.9;
          height: 63px;
          overflow: hidden;
          margin-bottom: 18px;
        }

        .r3-stats {
          display: flex;
          justify-content: space-between;
          margin-bottom: 22px;
          text-align: center;
        }

        .r3-stats .label {
          font-size: 11px;
          opacity: 0.6;
        }

        .r3-stats .value {
          font-size: 20px;
          font-weight: 700;
        }

        .r3-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
        }

        .r3-action-btn {
          width: 100%;
          max-width: 360px;
          height: 44px;
          border-radius: 999px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 14px;
          font-weight: 650;
          color: white;
          text-decoration: none;
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 0 10px 26px rgba(0, 0, 0, 0.45),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }

        .r3-btn-blue {
          background: linear-gradient(180deg, #0b1a3a, #08122a);
        }

        .r3-btn-green {
          background: linear-gradient(180deg, #073321, #052616);
        }

        .r3-btn-red {
          background: linear-gradient(180deg, #4a1010, #2f0b0b);
        }

        .r3-my-link-box {
          width: 100%;
          max-width: 360px;
          padding: 12px;
          border-radius: 16px;
          background: rgba(10, 15, 31, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.16);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .r3-my-link-url {
          font-size: 13px;
          word-break: break-all;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 12px;
        }

        .r3-copy-btn {
          height: 40px;
          border-radius: 999px;
          background: linear-gradient(180deg, #0b1a3a, #08122a);
          border: 1px solid rgba(255, 255, 255, 0.18);
          color: white;
          font-size: 13px;
          font-weight: 650;
        }

        .r3-error {
          color: #fca5a5;
          font-size: 13px;
          margin-top: 6px;
        }
      `}</style>
    </div>
  );
}
