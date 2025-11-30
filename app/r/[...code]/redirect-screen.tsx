// app/r/[...code]/redirect-screen.tsx
"use client";

type ShareRow = {
  ref_code: string;
  title: string | null;
  target_url: string | null;
  original_url: string | null;
  views: number | null;
  hop: number | null;
  message_id?: string | null;
};

export default function RedirectScreen({ share }: { share: ShareRow }) {
  const title = share.title || "R3 Hand-Forwarded Link";
  const url = share.target_url || share.original_url || "";

  // 중간 전달자가 자기 링크를 만들 때 쓸 주소 (필요에 따라 경로만 바꾸면 됨)
  const makeMyLinkUrl = `/share?parent=${share.ref_code}`;

  return (
    <div
      style={{
        margin: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "#020617",
        color: "#e5e7eb",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          padding: "32px 40px",
          borderRadius: 24,
          backgroundColor: "#020617",
          boxShadow: "0 20px 60px rgba(0,0,0,0.65)",
          minWidth: 420,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            marginBottom: 16,
            letterSpacing: 2,
            color: "#38bdf8",
          }}
        >
          R3 Hand-Forwarded Link
        </div>

        <div
          style={{
            fontSize: 24,
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: 14,
            opacity: 0.75,
            marginBottom: 24,
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
            gap: 10,
            alignItems: "center",
          }}
        >
          {/* 원본 링크로 이동 */}
          {url ? (
            <a
              href={url}
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

          {/* 내 링크 만들기 */}
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

          {/* 하단 정보 */}
          <div
            style={{
              fontSize: 12,
              opacity: 0.6,
              marginTop: 4,
            }}
          >
            Views: {share.views ?? 0} · Hop: {share.hop ?? 0}
          </div>
        </div>
      </div>
    </div>
  );
}
