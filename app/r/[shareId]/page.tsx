// app/r/[shareId]/page.tsx

import { Metadata } from "next";
// ⬇⬇⬇ 경로 수정: ../../../lib/supabaseServer 로 바뀜
import { supabaseServer } from "../../../lib/supabaseServer";

type PageProps = {
  params: { shareId: string };
};

// 이 페이지 / 메타데이터는 항상 동적으로 계산하도록 강제
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * generateMetadata()
 *
 * 카카오톡 / 페이스북 / 트위터 미리보기용 메타태그(og:image 등)를 생성한다.
 * 1. shareId (예: "F6C8uDm")를 r3_shares.ref_code로 보고 해당 row를 불러온다.
 *    -> numeric id, title
 * 2. 그 numeric id로 r3_hits에서 조회수 count
 * 3. og:image를 /api/ogimage?shareId=... 로 지정
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = supabaseServer();
  const shareCode = params.shareId; // ex) "F6C8uDm"

  // 1) r3_shares에서 ref_code = shareCode 인 row 찾기
  let numericId: number | null = null;
  let rawTitle = "(no title)";

  {
    const { data, error } = await supabase
      .from("r3_shares")
      .select("id, title")
      .eq("ref_code", shareCode)
      .maybeSingle();

    if (error) {
      console.error("[generateMetadata] r3_shares error:", error.message);
    }

    if (data) {
      if (typeof data.id === "number") {
        numericId = data.id;
      }
      if (data.title) {
        rawTitle = data.title;
      }
    }
  }

  // 2) 조회수 count: r3_hits에서 share_id == numericId
  let viewCount = 0;
  if (numericId !== null) {
    const { count, error } = await supabase
      .from("r3_hits")
      .select("*", { count: "exact", head: true })
      .eq("share_id", numericId);

    if (error) {
      console.error("[generateMetadata] r3_hits error:", error.message);
    }

    if (typeof count === "number") {
      viewCount = count;
    }
  }

  // 3) 메타태그에 들어갈 값들
  const pageTitle = rawTitle || "Shared content";
  const description = `Views: ${viewCount}`;
  const ogImageUrl = `https://r3-pre-mvp-full.vercel.app/api/ogimage?shareId=${shareCode}`;

  return {
    title: pageTitle,
    description,
    openGraph: {
      title: pageTitle,
      description,
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [ogImageUrl],
    },
  };
}

/**
 * 실제 페이지 본문
 *
 * - 현재는 정보 확인용 UI.
 * - 나중에 r3_shares에 실제 대상 URL(예: 유튜브 링크)이 있다면,
 *   그걸 읽어서 redirect()로 넘길 수 있다.
 */
export default async function SharePage({ params }: PageProps) {
  const supabase = supabaseServer();
  const shareCode = params.shareId;

  // r3_shares에서 이 공유의 제목 / id 다시 읽기
  const { data: shareRow } = await supabase
    .from("r3_shares")
    .select("id, title")
    .eq("ref_code", shareCode)
    .maybeSingle();

  const numericId = shareRow?.id ?? null;
  const titleText = shareRow?.title ?? "(no title)";

  // 조회수 가져오기
  let viewCount = 0;
  if (numericId !== null) {
    const { count } = await supabase
      .from("r3_hits")
      .select("*", { count: "exact", head: true })
      .eq("share_id", numericId);

    if (typeof count === "number") {
      viewCount = count;
    }
  }

  return (
    <main
      style={{
        fontFamily: "sans-serif",
        padding: "2rem",
        maxWidth: "480px",
        margin: "0 auto",
        textAlign: "center",
        lineHeight: "1.5",
      }}
    >
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 600,
          marginBottom: "1rem",
        }}
      >
        R3 Shared Link
      </h1>

      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: "12px",
          padding: "1rem",
          textAlign: "left",
          fontSize: "0.95rem",
          background: "#fafafa",
        }}
      >
        <p>
          <strong>Share ID:</strong> {shareCode}
        </p>
        <p>
          <strong>Title:</strong> {titleText}
        </p>
        <p>
          <strong>Views so far:</strong> {viewCount}
        </p>
      </div>

      <p
        style={{
          fontSize: "0.8rem",
          color: "#888",
          marginTop: "1.5rem",
        }}
      >
        This page publishes preview metadata (og:image, og:title, etc.)
        for KakaoTalk and other messaging apps.
      </p>
    </main>
  );
}
