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
    views,
    myViews,
    hop,
  } = share;

  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);
  const [myLink, setMyLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ 안전한 JSON 파서: 빈 바디/HTML 응답에도 안 죽게
  async function safeReadJson(res: Response): Promise<any | null> {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      // JSON이 아니면(예: HTML 에러) 텍스트로 처리
      return { _raw: text };
    }
  }

const handleCreateMyLink = async () => {
  try {
    setCreating(true);
    setError(null);
    setCopied(false);

    const res = await fetch("/api/share-child", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parentRefCode: ref_code, // ✅ 중요: 이전 정상 버전 키
      }),
    });

    const text = await res.text();

    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { _raw: text };
    }

    if (!res.ok) {
      throw new Error(data?.error || `링크 생성 실패 (HTTP ${res.status})`);
    }

    if (!data?.ok || !data?.shareUrl) {
      throw new Error(data?.error || "링크 생성 응답이 올바르지 않습니다.");
    }

    setMyLink(data.shareUrl);
    setCreated(true);
  } catch (e: any) {
    setError(e?.message || "링크 생성에 실패했습니다.");
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
        {/* ✅ 상단 브랜드 문구 복원 */}
        <div className="r3-brand">R³ · THE HUMAN NETWORK</div>

        <div className="r3-title">{title}</div>

        {/* 설명: 3줄 고정 박스 */}
        <div className="r3-desc">{description}</div>

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

        {/* 🔘 Buttons (순서: 원본 → 홈 → 내링크) */}
        <div className="r3-actions">
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

          <a href="/" className="r3-action-btn r3-btn-green">
            R3 홈페이지로 이동하기
          </a>

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
              <button type="button" className="r3-copy-btn" onClick={handleCopy}>
                {copied ? "복사됨!" : "링크 복사"}
              </button>
            </div>
          )}

          {error && <div className="r3-error">{error}</div>}
        </div>
      </div>

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
          padding: 22px 22px 26px; /* 살짝 컴팩트 */
          box-shadow: 0 40px 80px rgba(0, 0, 0, 0.55);
          color: white;
        }

        .r3-brand {
          font-size: 12px;
          letter-spacing: 0.22em;
          opacity: 0.75;
          margin-bottom: 10px;
        }

        .r3-title {
          font-size: 22px;
          font-weight: 800;
          margin-bottom: 10px;
        }

        .r3-desc {
          font-size: 14px;
          line-height: 1.5;
          opacity: 0.9;
          height: 63px; /* 14px * 1.5 * 3줄 ≈ 63px */
          overflow: hidden;
          margin-bottom: 18px;
        }

        .r3-stats {
          display: flex;
          justify-content: space-between;
          margin-bottom: 18px;
          text-align: center;
        }

        .r3-stats .label {
          font-size: 11px;
          opacity: 0.6;
        }

        .r3-stats .value {
          font-size: 20px;
          font-weight: 800;
        }

        .r3-actions {
          display: flex;
          flex-direction: column;
          gap: 10px; /* 버튼 간격도 조금 줄임 */
          align-items: center;
        }

        /* ✅ 버튼 높이 더 낮춤: 44px → 40px */
        .r3-action-btn {
          width: 100%;
          max-width: 360px;
          height: 36px;
          border-radius: 999px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 13px;
          font-weight: 650;
          color: white;
          text-decoration: none;
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.42),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
          transition: filter 0.12s ease, transform 0.12s ease,
            border-color 0.12s ease;
        }

        .r3-action-btn:hover {
          filter: brightness(1.06);
          border-color: rgba(255, 255, 255, 0.24);
        }
        .r3-action-btn:active {
          transform: translateY(1px);
        }
        .r3-action-btn:disabled {
          opacity: 0.55;
          cursor: default;
        }

        /* Premium Dark Blue / Green / Red */
.r3-btn-blue {
  background: linear-gradient(
    180deg,
    #143b8a 0%,   /* 상단 밝은 블루 */
    #0b1f4d 100%  /* 하단 안정적인 네이비 */
  );
}

.r3-btn-blue:hover {
  filter: brightness(1.1);
}


        .r3-btn-green {
          background: linear-gradient(180deg, #073321, #052616);
        }
        .r3-btn-red {
          background: linear-gradient(180deg, #4a1010, #2f0b0b);
        }

        /* ✅ MyLink 박스도 통일감 있게 */
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
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45);
        }

        .r3-my-link-url {
          font-size: 13px;
          word-break: break-all;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.9);
        }

        .r3-copy-btn {
          height:34px; /* 버튼보다 살짝 낮게 */
          border-radius: 999px;
          background: linear-gradient(180deg, #0b1a3a, #08122a);
          border: 1px solid rgba(255, 255, 255, 0.18);
          color: white;
          font-size: 13px;
          font-weight: 650;
          cursor: pointer;
          box-shadow: 0 10px 22px rgba(0, 0, 0, 0.38),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
          transition: filter 0.12s ease, transform 0.12s ease,
            border-color 0.12s ease;
        }

        .r3-copy-btn:hover {
          filter: brightness(1.06);
          border-color: rgba(255, 255, 255, 0.24);
        }
        .r3-copy-btn:active {
          transform: translateY(1px);
        }

        .r3-error {
          width: 100%;
          max-width: 360px;
          color: #fca5a5;
          font-size: 13px;
          margin-top: 6px;
          white-space: pre-wrap;
        }
      `}</style>
    </div>
  );
}
