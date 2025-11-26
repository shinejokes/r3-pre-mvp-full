// app/r/[...code]/page.tsx
import type { Metadata } from "next";
import { supabaseServer } from "../../../lib/supabaseServer";
import RedirectScreen from "./redirect-screen";

export const dynamic = "force-dynamic";

type ShareRow = {
  ref_code: string;
  title: string | null;
  target_url: string | null;
  original_url: string | null;
  views: number | null;
  hop: number | null;
};

interface PageParams {
  code: string[]; // [...code]라서 배열
}

interface PageProps {
  params: Promise<PageParams>;
}

function extractRefCode(code: string[] | string): string {
  return Array.isArray(code) ? code[0] : code;
}

// ---------- 메타데이터(OG 이미지) ----------
export async function generateMetadata(
  { params }: PageProps
): Promise<Metadata> {
  const resolved = await params;
  const refCode = extractRefCode(resolved.code);

  const supabase = supabaseServer();
  const { data } = await supabase
    .from("r3_shares")
    .select("title")
    .eq("ref_code", refCode)
    .maybeSingle<Pick<ShareRow, "title">>();

  const title = data?.title || "R3 Hand-Forwarded Link";

  const base =
    process.env.R3_APP_BASE_URL || "https://r3-pre-mvp-full.vercel.app";

  const ogImageUrl = `${base}/api/ogimage?shareId=${refCode}`;

  return {
    title,
    openGraph: {
      title,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

// ---------- 실제 페이지 ----------
export default async function ShareRedirectPage({ params }: PageProps) {
  const resolved = await params;
  const refCode = extractRefCode(resolved.code);

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("r3_shares")
    .select("ref_code, title, target_url, original_url, views, hop")
    .eq("ref_code", refCode)
    .maybeSingle<ShareRow>();

  if (error || !data) {
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
        <div>
          <h1>유효하지 않은 링크입니다</h1>
          <p>공유 코드: {refCode}</p>
        </div>
      </div>
    );
  }

  // 1) 클릭 로그: r3_hits에 기록 (기존 테이블 구조 그대로 사용)
  //    r3_hits 테이블에 share_id(text) 컬럼이 있다고 가정
  const { error: hitError } = await supabase
    .from("r3_hits")
    .insert({ share_id: refCode });

  if (hitError) {
    // 로그만 남기고, 조회수 업데이트/리다이렉트는 계속 진행
    console.error("Failed to insert hit", hitError);
  }

  // 2) 이 공유 링크 자체의 views 컬럼도 +1 (기존 동작 유지)
  const currentViews = data.views ?? 0;

  const { error: updateError } = await supabase
    .from("r3_shares")
    .update({ views: currentViews + 1 })
    .eq("ref_code", refCode);

  const updatedShare: ShareRow = {
    ...data,
    views: updateError ? currentViews : currentViews + 1,
  };

  return <RedirectScreen share={updatedShare} />;
}
