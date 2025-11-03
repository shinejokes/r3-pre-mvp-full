// app/r/[shareId]/page.tsx

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { supabaseServer } from "../../../lib/supabaseServer";

type PageProps = {
  params: { shareId: string };
};

// 페이지와 metadata는 동적이어야 함 (Supabase 호출 때문에)
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * 1) 카카오톡/페북 등 미리보기용 메타데이터
 *    -> title, description(view count), og:image
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = supabaseServer();
  const shareCode = params.shareId;

  // r3_shares에서 id, title 가져오기
  let numericId: number | null = null;
  let rawTitle = "(no title)";

  {
    const { data } = await supabase
      .from("r3_shares")
      .select("id, title")
      .eq("ref_code", shareCode)
      .maybeSingle();

    if (data) {
      if (typeof data.id === "number") numericId = data.id;
      if (data.title) rawTitle = data.title;
    }
  }

  // 조회수 카운트
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
 * 2) 실제 페이지 접근 시 동작
 *    -> 조회수 기록 남기고 바로 target_url로 redirect
 */
export default async function SharePage({ params }: PageProps) {
  const supabase = supabaseServer();
  const shareCode = params.shareId;

  // ref_code로 r3_shares row 전체를 읽는다 (id, title, target_url 등)
  const { data: shareRow } = await supabase
    .from("r3_shares")
    .select("id, title, target_url")
    .eq("ref_code", shareCode)
    .maybeSingle();

  // 만약 row가 없다면: 일단 기본 fallback 페이지를 보여준다.
  if (!shareRow) {
    // 조회수는 기록할 수 없고, redirect도 할 수 없다.
    return (
      <main style={{ fontFamily: "sans-serif", padding: "2rem", textAlign: "center" }}>
        <h1>Link not found</h1>
        <p>Invalid share code: {shareCode}</p>
      </main>
    );
  }

  const numericId = shareRow.id as number | undefined;
  const titleText = shareRow.title ?? "(no title)";
  const targetUrl = shareRow.target_url ?? null;

  // 1) 조회수 기록 (r3_hits insert)
  if (numericId !== undefined) {
    await supabase
      .from("r3_hits")
      .insert([
        {
          share_id: numericId,
          viewer_fingerprint: "server-record", // TODO: 나중에 고유값 넣을 수 있음
        },
      ]);
  }

  // 2) redirect
  if (targetUrl) {
    // 사용자를 실제 컨텐츠로 이동
    redirect(targetUrl);
  }

  // targetUrl이 없으면 그냥 간단한 정보 페이지만 띄운다
  // (이 경우는 아직 target_url이 비어 있을 때의 임시 동작)
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
          <strong>Target URL:</strong> {targetUrl ?? "(not set yet)"}
        </p>
        <p style={{ color: "#888" }}>
          Note: Redirect will happen automatically once this link is configured.
        </p>
      </div>
    </main>
  );
}
