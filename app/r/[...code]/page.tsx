// app/r/[...code]/page.tsx
import type { Metadata } from "next";
import { supabaseServer } from "../../../lib/supabaseServer";
import RedirectScreen from "./redirect-screen";

// 이 페이지는 항상 동적으로 렌더링 (조회수 증가 위해)
export const dynamic = "force-dynamic";

type ShareRow = {
  ref_code: string;
  title: string | null;
  target_url: string | null;
  original_url: string | null;
  views: number | null;
  hop: number | null;
};

// Next 16에서는 params가 Promise 형태이며,
// [...code]라서 code는 string[] 형태임
interface PageParams {
  code: string[]; // /r/abcd123 → ["abcd123"]
}

interface PageProps {
  params: Promise<PageParams>;
}

// 공통: 배열일 수도 있는 code에서 실제 ref_code 추출
function extractRefCode(code: string[] | string): string {
  return Array.isArray(code) ? code[0] : code;
}

// -----------------------------
// 1) 메타데이터 (OG 이미지 설정)
// -----------------------------
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

// -----------------------------
// 2) 실제 페이지 (리다이렉트 화면)
// -----------------------------
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

  // 🔢 현재 views 값
  const currentViews = data.views ?? 0;

  // 🔢 DB에 조회수 +1 반영
  const { error: updateError } = await supabase
    .from("r3_shares")
    .update({ views: currentViews + 1 })
    .eq("ref_code", refCode);

  // 화면에 넘길 값도 +1 적용 (만약 updateError가 났으면 기존 값 유지)
  const updatedShare: ShareRow = {
    ...data,
    views: updateError ? currentViews : currentViews + 1,
  };

  // layout.tsx 가 <html><body>를 감싸고 있으므로 여기서는 컴포넌트만 반환
  return <RedirectScreen share={updatedShare} />;
}
