// app/r/[ref]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type ShareRow = {
  ref_code: string;
  title: string | null;
  original_url: string | null;
  target_url: string | null;
  hop: number | null;
  message_id: string | null;
};

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; share: ShareRow };

export default function R3SharePreviewPage() {
  const pathname = usePathname();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    if (!pathname) return;

    // /r/LoBwAnW → ["r","LoBwAnW"] → 마지막 조각이 refCode
    const segments = pathname.split("/").filter(Boolean);
    const refCode = segments[segments.length - 1];

    if (!refCode) {
      setState({
        status: "error",
        message: "URL에 refCode가 없습니다.",
      });
      return;
    }

    async function load() {
      try {
        const res = await fetch(`/api/share/${refCode}`);
        const json = await res.json();

        if (!res.ok) {
          setState({
            status: "error",
            message: json?.error || "등록된 대상 URL을 찾을 수 없습니다.",
          });
          return;
        }

        setState({
          status: "ok",
          share: json.share as ShareRow,
        });
      } catch (e: any) {
        setState({
          status: "error",
          message: e?.message || "알 수 없는 오류",
        });
      }
    }

    load();
  }, [pathname]);

  if (state.status === "loading") {
    return (
      <main style={{ maxWidth: 600, margin: "40px auto", fontFamily: "sans-serif" }}>
        <h1>R3 Link Preview</h1>
        <p>불러오는 중입니다…</p>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main style={{ maxWidth: 600, margin: "40px auto", fontFamily: "sans-serif" }}>
        <h1>R3 Link Preview</h1>
        <p>등록된 대상 URL을 찾을 수 없습니다.</p>
        <p style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
          ({state.message})
        </p>
      </main>
    );
  }

  const { share } = state;
  const title = share.title ?? "(제목 없음)";
  const originUrl = share.original_url ?? share.target_url ?? "";
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
          <strong>현재 hop:</strong> {hop}</p>
        <p style={{ marginTop: 4, fontSize: 13, color: "#666" }}>
          (이 페이지는 공유된 썸네일이 연결되는 “중간 랜딩 페이지”입니다.)
        </p>
        <p style={{ marginTop: 8, fontSize: 11, color: "#999" }}>
          ref_code: {share.ref_code} / message_id: {share.message_id ?? "NULL"}
        </p>
      </section>
    </main>
  );
}
