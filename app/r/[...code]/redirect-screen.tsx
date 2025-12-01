// app/r/[...code]/redirect-screen.tsx
"use client";

type ShareRow = {
  ref_code: string;
  title: string | null;
  original_url: string | null;
  target_url: string | null;
  views: number | null;
  hop: number | null;
  message_id?: string | null;
};

interface RedirectScreenProps {
  share: ShareRow;
}

export default function RedirectScreen({ share }: RedirectScreenProps) {
  const safeTitle = share.title || "R3 Hand-Forwarded Link";
  const currentViews = share.views ?? 0;
  const currentHop = share.hop ?? 1;
  const targetUrl = share.target_url || share.original_url || "";

  // 🔹 내 링크 만들기: /share?messageId=...&parentRefCode=...
// ✅ message_id가 있으면 /share/[messageId]?parentRefCode=... 로 이동
//    (예전 동작 복원)
const makeMyLinkUrl = share.message_id
  ? `/share/${share.message_id}?parentRefCode=${share.ref_code}`
  : `/share`;


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
          padding: "32px 32px 26px 32px",
          background:
            "radial-gradient(circle at top left, #1d2837 0, #020617 55%)",
          boxShadow: "0 20px 48px rgba(0,0,0,0.55)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 16,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#38bdf8",
            marginBottom: 16,
          }}
        >
          R3 Hand-Forwarded Link
        </div>

        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          {safeTitle}
        </div>

        <div
          style={{
            fontSize: 14,
            color: "#cbd5f5",
            lineHeight: 1.7,
            marginBottom: 28,
          }}
        >
          이 링크는 다른 사람이 R3를 통해 전달한 메시지입니다.
          <br />
          아래 버튼을 눌러 원본 콘텐츠로 이동하거나,
          <br />
          나만의 링크를 만들어 전달해 보세요.
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          {/* 원본 링크로 이동 */}
          {targetUrl ? (
            <a
              href={targetUrl}
              style={{
                display: "inline-block",
                padding: "10px 28px",
                borderRadius: 999,
                background:
                  "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 40%, #22c55e 100%)",
                color: "#0f172a",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              원본 링크로 이동
            </a>
          ) : (
            <div
              style={{
                fontSize: 13,
                opacity: 0.7,
              }}
            >
              연결된 원본 URL이 없어 이동할 수 없습니다.
            </div>
          )}

          {/* 내 링크 만들기 페이지로 이동 */}
          <a
            href={makeMyLinkUrl}
            style={{
              display: "inline-block",
              padding: "8px 22px",
              borderRadius: 999,
              border: "1px solid #38bdf8",
              color: "#e5e7eb",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: 14,
              marginTop: 4,
            }}
          >
            내 링크 만들기
          </a>
        </div>

        <div
          style={{
            fontSize: 12,
            opacity: 0.7,
            marginTop: 4,
          }}
        >
          Views: {currentViews} · Hop: {currentHop}
        </div>
      </div>
    </div>
  );
}
