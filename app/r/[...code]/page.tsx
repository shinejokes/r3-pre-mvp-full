// app/r/[code]/page.tsx
import type { Metadata } from "next";
import { supabaseServer } from "../../../lib/supabaseServer";
import RedirectScreen from "./redirect-screen";

type ShareRow = {
  ref_code: string;
  title: string | null;
  target_url: string | null;
  original_url: string | null;
  views: number | null;
  hop: number | null;
};

// ✅ Next 16에서는 params 가 Promise 형태
interface PageProps {
  params: Promise<{ code: string }>;
}

// -----------------------------
// 1) 메타데이터 (OG 이미지 설정)
// -----------------------------
export async function generateMetadata(
  { params }: PageProps
): Promise<Metadata> {
  const { code } = await params;

  const supabase = supabaseServer();
  const { data } = await supabase
    .from("r3_shares")
    .select("title")
    .eq("ref_code", code)
    .maybeSingle<Pick<ShareRow, "title">>();

  const title = data?.title || "R3 Hand-Forwarded Link";

  const base =
    process.env.R3_APP_BASE_URL || "https://r3-pre-mvp-full.vercel.app";

  const ogImageUrl = `${base}/api/ogimage?shareId=${code}`;

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
  const { code } = await params; // ✅ Promise 해제

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("r3_shares")
    .select("ref_code, title, target_url, original_url, views, hop")
    .eq("ref_code", code)
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
          <p>공유 코드: {code}</p>
        </div>
      </div>
    );
  }

  // layout.tsx 가 <html><body>를 감싸고 있으므로 여기서는 컴포넌트만 반환
  return <RedirectScreen share={data} />;
}
