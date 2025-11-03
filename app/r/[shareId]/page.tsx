// app/r/[shareId]/page.tsx

import { Metadata } from "next";
import { supabaseServer } from "../../lib/supabaseServer";

type PageProps = {
  params: { shareId: string };
};

/**
 * generateMetadata()
 *
 * 이 함수는 Next.js App Router에서 <head> 메타태그(og:image 등)를 생성합니다.
 * 카카오톡 / 페이스북 / 트위터 등이 링크 미리보기를 만들 때
 * 바로 이 값들을 사용합니다.
 *
 * 여기서는:
 * 1. params.shareId (예: "F6C8uDm") 를 ref_code로 보고 r3_shares에서 행을 찾고
 *    - numeric id (예: 25)
 *    - title
 * 2. 그 numeric id로 r3_hits에서 조회수를 count
 * 3. og:image 를 우리가 만든 동적 썸네일 API로 지정
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = supabaseServer();
  const shareCode = params.shareId; // ex) "F6C8uDm"

  // 1) r3_shares에서 ref_code = shareCode인 row 찾기
  //    우리가 알고 있는 컬럼: id (number), ref_code (string), title (string?)
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

  // 2) 조회수: r3_hits에서 share_id == numericId 인 row 개수
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

  // 3) 제목/설명/이미지 준비
  //    - title은 그대로 쓰되, 너무 긴 한글/문자를 썸네일에선 우리가 폰트 처리하기 까다로우므로
  //      메타태그 쪽에서는 그냥 rawTitle 그대로 둬도 됩니다.
  //    - description은 현재 조회수 포함
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
 * 지금은 간단히 정보만 보여준다.
 * (원래 redirect() 로 외부 URL로 보내는 것도 가능하지만,
 *  현재 스키마에서 target URL이 어디 저장되는지 100% 확신이 없으므로
 *  안전하게 정보 표시용으로 둔다.
 *
 * 나중에 r3_shares 테이블에 예: target_url 같은 필드가 있다면
 * supabase에서 불러와서 redirect(...) 하면 된다.)
 */
export default async function SharePage({ params }: PageProps) {
  const supabase = supabaseServer();
  const shareCode = params.shareId;

  // r3_shares에서 title과 id를 다시 읽어온다 (본문에도 표시해주려고)
  const { data: shareRow } = await supabase
    .from("r3_shares")
    .select("id, title")
    .eq("ref_code", shareCode)
    .maybeSingle();

  const numericId = shareRow?.id ?? null;
  const titleText = shareRow?.title ?? "(no title)";

  // 현재까지의 조회수도 표시해 보자
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
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "1rem" }}>
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

      <p style={{ fontSize: "0.8rem", color: "#888", marginTop: "1.5rem" }}>
        This page also provides preview metadata (og:image) for KakaoTalk and
        other messaging apps.
      </p>
    </main>
  );
}
