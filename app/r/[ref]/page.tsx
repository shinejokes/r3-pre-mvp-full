// app/r/[ref]/page.tsx
import React from "react";
import { supabaseServer } from "../../../lib/supabaseServer";

type PageProps = {
  params: Record<string, string>;
};

export default async function R3SharePreviewPage({ params }: PageProps) {
  const supabase = supabaseServer();

  // params 안의 첫 번째 키를 refCode로 사용 (예: { ref: "LoBwAnW" })
  const paramKeys = Object.keys(params || {});
  const firstKey = paramKeys.length > 0 ? paramKeys[0] : "";
  const refCode = firstKey ? (params as any)[firstKey] : "";

  // refCode를 못 얻으면 바로 안내
  if (!refCode) {
    return (
      <main style={{ maxWidth: 600, margin: "40px auto", fontFamily: "sans-serif" }}>
        <h1>R3 Link Preview</h1>
        <p>등록된 대상 URL을 찾을 수 없습니다.</p>
        <p style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
          (params가 비어 있습니다)
        </p>
      </main>
    );
  }

  // 1) ref_code로 r3_shares에서 share 찾기
  const { data: share, error: shareError } = await supabase
    .from("r3_shares")
    .select("*")
    .eq("ref_code", refCode)
    .maybeSingle();

  if (shareError) {
    console.error("share fetch error:", shareError);
  }

  // share 자체를 못 찾으면 진짜 없는 링크
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

  // 화면에 쓸 값: share 한 줄만으로 충분
  const title = share.title ?? "(제목 없음)";
  const originUrl =
    share.original_url ??
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
