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

  if (shareError) {
    console.error("share fetch error:", shareError);
  }

  // share 자체를 못 찾으면 정말로 없는 링크
  if (!share) {
    return (
      <main style={{ maxWidth: 600, margin: "40px auto", fontFamily: "sans-serif" }}>
        <h1>R3 Link Preview</h1>
        <p>등록된 대상 URL을 찾을 수 없습니다.</p>
        <p style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
          (ref_code: {refCode})
        </p>
      </main>
    );
  }

  // 2) 가능하면 메시지도 한번 조회 (추가 정보용, 프리뷰는 share만으로도 가능)
  let message: any = null;
  if (share.message_id) {
    const { data: msg, error: msgError } = await supabase
      .from("r3_messages")
      .select("*")
      .eq("uuid", share.message_id)
      .maybeSingle();

    if (msgError) {
      console.error("message fetch error:", msgError);
    }
    message = msg;
  }

  // 3) 화면에 쓸 값 정리: share에 있으면 share 기준, 없으면 message 기준
  const title =
    share.title ??
    message?.title ??
    "(제목 없음)";

  const originUrl =
    share.original_url ??
    message?.origin_url ??
    message?.url ??
    share.target_url ??
    "";

  const hop = share.hop ?? 1;

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
          <strong>제목:</strong> {title}
        </p>

        <p style={{ marginTop: 8 }}>
          <strong>원본 URL:</strong>{" "}
          {originUrl ? (
            <a href={originUrl} target="_blank" rel="noreferrer">
              {originUrl}
            </a>
          ) : (
            "URL 정보 없음"
          )}
        </p>

        <p style={{ marginTop: 8 }}>
          <strong>현재 hop:</strong> {hop}
        </p>

        <p style={{ marginTop: 4, fontSize: 13, color: "#666" }}>
          (이 페이지는 공유된 썸네일이 연결되는 “중간 랜딩 페이지”입니다.)
        </p>

        <p style={{ marginTop: 8, fontSize: 11, color: "#999" }}>
          ref_code: {share.ref_code} / message_id: {share.message_id ?? "NULL"}
        </p>
      </section>

      {/* 다음 단계에서 여기 아래에 “내 링크 만들기” 버튼을 붙일 예정 */}
    </main>
  );
}
