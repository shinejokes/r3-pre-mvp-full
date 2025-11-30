// app/r/[...code]/redirect-screen.tsx
"use client";

import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

type ShareRow = {
  ref_code: string;
  title: string | null;
  target_url: string | null;
  original_url: string | null;
  views: number | null;
  hop: number | null;
  message_id?: string | null;
};

// 브라우저용 Supabase 클라이언트
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function RedirectScreen({ share }: { share: ShareRow }) {
  useEffect(() => {
    const logHitAndRedirect = async () => {
      try {
        // 1) r3_hits에 기록 (share_id + message_id)
        if (share.ref_code) {
          const payload: { share_id: string; message_id?: string } = {
            share_id: share.ref_code,
          };
          if (share.message_id) {
            payload.message_id = share.message_id;
          }

          const { error } = await supabase
            .from("r3_hits")
            .insert(payload);

          if (error) {
            console.error("Failed to insert hit (client)", error);
          }
        }
      } catch (err) {
        console.error("Unexpected error while logging hit", err);
      }

      // 2) 원본/타겟 URL로 이동
      const url = share.target_url || share.original_url;
      if (url) {
        window.location.href = url;
      } else {
        console.warn("No target_url/original_url to redirect to.");
      }
    };

    logHitAndRedirect();
  }, [share]);

  const title = share.title || "R3 Hand-Forwarded Link";

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
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>{title}</h1>
        <p style={{ fontSize: 16, opacity: 0.8, marginBottom: 4 }}>
          원본 링크로 이동하는 중입니다...
        </p>
        <p style={{ fontSize: 13, opacity: 0.6 }}>
          잠시만 기다려 주세요.
        </p>
      </div>
    </div>
  );
}
