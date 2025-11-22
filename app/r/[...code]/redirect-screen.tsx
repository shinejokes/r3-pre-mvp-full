// app/r/[code]/redirect-screen.tsx
"use client";

import { useEffect } from "react";

type ShareRow = {
  ref_code: string;
  title: string | null;
  target_url: string | null;
  original_url: string | null;
  views: number | null;
  hop: number | null;
};

export default function RedirectScreen({ share }: { share: ShareRow }) {
  useEffect(() => {
    const go = async () => {
      try {
        // 1) 조회수 +1
        await fetch("/api/view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ref_code: share.ref_code }),
        });
      } catch (e) {
        console.error("Failed to send view event", e);
      }

      // 2) 원본/타겟 URL로 이동
      const dest = share.target_url || share.original_url;
      if (dest) {
        window.location.href = dest;
      }
    };

    // 살짝 딜레이를 줘도 되고, 바로 실행해도 됨
    const timer = setTimeout(go, 400);
    return () => clearTimeout(timer);
  }, [share.ref_code, share.target_url, share.original_url]);

  // 사용자에게 보이는 대기 화면 (지금 보이던 문구 그대로 써도 됨)
  return (
    <div
      style={{
        height: "100vh",
        background:
          "radial-gradient(circle at top, #1f2937 0%, #020617 55%, #000 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#e5e7eb",
        fontFamily: "system-ui, sans-serif",
        padding: "0 24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          maxWidth: 480,
          padding: "32px 24px",
          borderRadius: 24,
          backgroundColor: "rgba(15,23,42,0.92)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            fontSize: 20,
            letterSpacing: 6,
            marginBottom: 24,
            color: "#9ca3af",
          }}
        >
          R3 HAND-FORWARDED LINK
        </div>
        <h1 style={{ fontSize: 24, margin: 0, marginBottom: 16 }}>
          원본 페이지로 연결 중입니다…
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.5, marginBottom: 8 }}>
          잠시 후 원본 컨텐츠로 이동합니다. 새 창에서 열릴 수도 있습니다.
        </p>
        <p style={{ fontSize: 13, color: "#9ca3af" }}>
          만약 자동으로 이동하지 않으면, 브라우저의 뒤로 가기를 눌러주세요.
        </p>
      </div>
    </div>
  );
}
