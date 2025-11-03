// app/r/[shareId]/page.tsx

import { Metadata } from "next";
import { supabaseServer } from "../../lib/supabaseServer";

type PageProps = {
  params: { shareId: string };
};

// ✅ 중요: 이 페이지와 메타데이터는 항상 서버에서 동적으로 계산하라고
// Next.js에게 명령합니다. (정적으로 빌드하려다가 Supabase 호출 때문에
// Vercel에서 에러 나는 걸 막아줍니다.)
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * generateMetadata()
 *
 * 이 함수는 Next.js App Router에서 <head> 메타태그(og:image 등)를 생성합니다.
 * 카카오톡 / 페이스북 / 트위터 등이 링크 미리보기를 만들 때 이 정보를 씁니다.
 *
 * 동작 요약:
 * 1. params.shareId (예: "F6C8uDm")를 ref_code로 보고 r3_shares에서 row를 찾는다
 *    - id (숫자 기본키)
 *    - title
 * 2. 그 id로 r3_hits를 count해서 조회수(viewCount)를 얻는다
 * 3. og:image 로 우리가 만든 동적 썸네일
 *    https://r3-pre-mvp-full.vercel.app/api/ogimage?shareId=...
 *    를 지정한다
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = supabaseServer();
  const shareCode = params.shareId; // ex) "F6C8uDm"

  // 1) r3_shares에서 ref_code = shareCode인 row 찾기
  //    컬럼: id (number), title (string?)
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

  // 2) 조회수 카운트: r3_hits에서 share_id == numericId
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
 * 페이지 본문
 *
 * - 현재는 단순히 정보만 보여줍니다.
 * - 나중에 "이 공유는 실제 유튜브 링크 XX로 보내라" 같은 목적지가 정해지면,
 *   r3_shares에서 그 URL을 읽어서 redirect(...)로 보내도록 바꿀 수 있습니다.
 * - 여기서는 직접 조회수까지 다시 읽어서 화면에도 보여줍니다.
 */
export default async function SharePage({ params }: PageProps) {
  const supabase = supabaseServer();
  const shareCode = params.shareId;

  // 다시 r3_shares에서 정보 읽기 (title / numeric id)
  const { data: shareRow } = await supabase
    .from("r3_shares")
    .select("id, title")
    .eq("ref_code", shareCode)
    .maybeSingle();

  const numericId = shareRow?.id ?? null;
  const titleText = shareRow?.title ?? "(no title)";

  // 조회수
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
