// app/r/[ref]/page.tsx
import React from "react";
import { supabaseServer } from "../../../lib/supabaseServer";

type PageProps = {
  params: { ref: string };
};

export default async function R3SharePreviewPage({ params }: PageProps) {
  const supabase = supabaseServer();
  const refCode = params.ref;

  // 1) ref_code로 r3_shares에서 share 찾기
  const { data: share, error: shareError } = await supabase
    .from("r3_shares")
    .select("*")
    .eq("ref_code", refCode)
    .maybeSingle();

  if (!share) {
    return (
      <main style={{ maxWidth: 600, margin: "40px auto", fontFamily: "sans-serif" }}>
        <h1>R3 Link Preview</h1>
        <p>등록된 대상 URL을 찾을 수 없습니다.</p>
      </main>
    );
  }

  // 2) share가 가리키는 메시지(uuid 기준) 조회
  const { data: message } = await supabase
    .from("r3_messages")
    .select("*")
    .eq("uuid", share.message_uuid)
    .maybeSingle();

  if (!message) {
    return (
      <main style={{ maxWidth: 600, margin: "40px auto", fontFamily: "sans-serif" }}>
        <h1>R3 Link Preview</h1>
        <p>등록된 대상 URL을 찾을 수 없습니다.</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 600, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>R3 Link Preview</h1>

      <section
        style={{
          marginTop: 24,
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 8,
          background: "#fafafa",
        }}
      >
        <p>
          <strong>제목:</strong> {message.title ?? "(제목 없음)"}
        </p>
        <p style={{ marginTop: 8 }}>
          <strong>원본 URL:</strong>{" "}
          <a href={message.origin_url} target="_blank" rel="noreferrer">
            {message.origin_url}
          </a>
        </p>

        <p style={{ marginTop: 8 }}>
          <strong>현재 hop:</strong> {share.hop ?? 1}
        </p>
        <p style={{ marginTop: 4, fontSize: 13, color: "#666" }}>
          (이 페이지는 공유된 썸네일이 연결되는 “중간 랜딩 페이지”입니다.)
        </p>
      </section>

      {/* 2단계에서 여기 아래에 “내 링크 만들기” 버튼을 붙임 */}
    </main>
  );
}
