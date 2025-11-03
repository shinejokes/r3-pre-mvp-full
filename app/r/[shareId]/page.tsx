// app/r/[shareId]/page.tsx

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { supabaseServer } from "../../../lib/supabaseServer";
import { headers } from "next/headers";

type PageProps = {
  params: { shareId: string };
  searchParams?: { [key: string]: string | string[] | undefined };
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * generateMetadata
 * -> 카카오톡/페북/트위터 미리보기 카드용 메타태그
 *    썸네일(og:image)과 og:url까지 지정
 */
export async function generateMetadata({
  params,
}: {
  params: { shareId: string };
}): Promise<Metadata> {
  const supabase = supabaseServer();
  const shareCode = params.shareId;

  // 1) share info
  let numericId: number | string | null = null;
  let rawTitle = "(no title)";

  {
    const { data } = await supabase
      .from("r3_shares")
      .select("id, title")
      .eq("ref_code", shareCode)
      .maybeSingle();

    if (data) {
      numericId = data.id ?? null;
      if (data.title) rawTitle = data.title;
    }
  }

  // 2) view count
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

  const pageTitle = rawTitle || "Shared content";
  const description = `Views: ${viewCount}`;
  const ogImageUrl = `https://r3-pre-mvp-full.vercel.app/api/ogimage?shareId=${shareCode}`;
  const ogPageUrl = `https://r3-pre-mvp-full.vercel.app/r/${shareCode}`;

  return {
    title: pageTitle,
    description,
    openGraph: {
      title: pageTitle,
      description,
      url: ogPageUrl, // 👈 카드 하단 링크 유도
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
 * SharePage
 *
 * 1. Supabase에서 shareRow(id, title, target_url) 읽기
 * 2. user-agent 확인해서 카카오 미리보기 봇인지 구분
 * 3. (봇이 아니고 디버그 모드가 아니면) r3_hits에 insert
 * 4. 디버그 모드가 아니면 redirect(target_url)
 * 5. 디버그 모드라면 redirect하지 않고 결과/에러/상태를 화면에 출력
 *
 * -> 이렇게 하면 지금 왜 hits가 안 쌓이는지 즉시 알 수 있습니다.
 */
export default async function SharePage({ params, searchParams }: PageProps) {
  const supabase = supabaseServer();
  const shareCode = params.shareId;
  const debugMode = searchParams?.debug === "1";

  // 1. share 정보 가져오기
  const { data: shareRow } = await supabase
    .from("r3_shares")
    .select("id, title, target_url")
    .eq("ref_code", shareCode)
    .maybeSingle();

  if (!shareRow) {
    return (
      <main style={{ fontFamily: "sans-serif", padding: "2rem", textAlign: "center" }}>
        <h1>Link not found</h1>
        <p>Invalid share code: {shareCode}</p>
        <p>debug={String(debugMode)}</p>
      </main>
    );
  }

  // Postgres int8 can come back as string in JS
  const numericId = shareRow.id;
  const titleText = shareRow.title ?? "(no title)";
  const targetUrl = shareRow.target_url ?? null;

  // 2. user-agent 분석 (카카오 미리보기 봇은 조회수 카운트 안 하도록)
  const ua = headers().get("user-agent") || "";
  const isKakaoBot =
    ua.includes("KAKAOTALK") ||
    ua.includes("KAKAOBOT") ||
    ua.includes("kakaotalk") ||
    ua.includes("Kakao");

  // 3. hits insert 시도
  let insertError: string | null = null;
  let insertOK = false;

  if (numericId !== undefined && numericId !== null && !isKakaoBot) {
    const { error } = await supabase
      .from("r3_hits")
      .insert([
        {
          share_id: numericId,
          viewer_fingerprint: "server-record",
        },
      ]);

    if (error) {
      insertError = error.message;
      insertOK = false;
    } else {
      insertOK = true;
    }
  }

  // 4. 디버그 모드라면 redirect하지 말고 상태를 보여주자
  if (debugMode) {
    // 최신 viewCount 다시 읽어보기 (insert가 성공했다면 증가했겠지)
    let newCount = 0;
    if (numericId !== null && numericId !== undefined) {
      const { count } = await supabase
        .from("r3_hits")
        .select("*", { count: "exact", head: true })
        .eq("share_id", numericId);

      if (typeof count === "number") {
        newCount = count;
      }
    }

    return (
      <main
        style={{
          fontFamily: "sans-serif",
          padding: "2rem",
          maxWidth: "480px",
          margin: "0 auto",
          lineHeight: "1.5",
        }}
      >
        <h1>DEBUG MODE</h1>
        <p>
          <strong>Share ID:</strong> {shareCode}
        </p>
        <p>
          <strong>Title:</strong> {titleText}
        </p>
        <p>
          <strong>Target URL:</strong> {targetUrl ?? "(none)"}
        </p>
        <p>
          <strong>User-Agent:</strong> {ua}
        </p>
        <p>
          <strong>Kakao bot?</strong> {String(isKakaoBot)}
        </p>
        <p>
          <strong>Insert OK?</strong> {String(insertOK)}
        </p>
        <p>
          <strong>Insert Error:</strong> {insertError ?? "(none)"}
        </p>
        <p>
          <strong>Current viewCount:</strong> {newCount}
        </p>
        <p>debug=1 so no redirect taken.</p>
      </main>
    );
  }

  // 5. 디버그 모드가 아니고 target_url이 있다면 실제 대상지로 리다이렉트
  if (targetUrl) {
    redirect(targetUrl);
  }

  // target_url이 아직 없는 경우: 간단 안내 페이지
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
      <h1>R3 Shared Link</h1>
      <p>
        <strong>Share ID:</strong> {shareCode}
      </p>
      <p>
        <strong>Title:</strong> {titleText}
      </p>
      <p>
        <strong>Target URL:</strong> {targetUrl ?? "(not set yet)"}
      </p>
      <p style={{ color: "#888" }}>
        (No redirect because target_url is not defined)
      </p>
    </main>
  );
}
