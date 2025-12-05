// app/r/[...code]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { supabaseServer } from "../../../lib/supabaseServer";
import RedirectScreen from "./redirect-screen";

export const dynamic = "force-dynamic";

type ShareRow = {
  ref_code: string;
  title: string | null;
  target_url: string | null;
  original_url: string | null;
  views: number | null; // 이 링크의 R3 조회수
  hop: number | null;
  message_id: string | null;
};

interface PageParams {
  code: string[];
}

interface PageProps {
  params: Promise<PageParams>;
}

function extractRefCode(code: string[] | string): string {
  return Array.isArray(code) ? code[0] : code;
}

/* ---------------------------------------------
   1) OG IMAGE META
--------------------------------------------- */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const resolved = await params;
  const refCode = extractRefCode(resolved.code);

  const supabase = supabaseServer();
  const { data } = await supabase
    .from("r3_shares")
    .select("title")
    .eq("ref_code", refCode)
    .maybeSingle();

  const title = data?.title || "R³ Hand-Forwarded Link";

  const base =
    process.env.R3_APP_BASE_URL || "https://r3-pre-mvp-full.vercel.app";
  const ogImageUrl = `${base}/api/ogimage?shareId=${refCode}`;

  return {
    title,
    openGraph: {
      title,
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
  };
}

/* ---------------------------------------------
   2) MAIN PAGE LOGIC
--------------------------------------------- */
export default async function ShareRedirectPage({ params }: PageProps) {
  const resolved = await params;
  const refCode = extractRefCode(resolved.code);

  const supabase = supabaseServer();

  /* -- 공유 정보 불러오기 -- */
  const { data, error } = await supabase
    .from("r3_shares")
    .select(
      "ref_code, title, target_url, original_url, views, hop, message_id"
    )
    .eq("ref_code", refCode)
    .maybeSingle<ShareRow>();

  if (error || !data) {
    return (
      <div
        style={{
          backgroundColor: "#020617",
          height: "100vh",
          color: "white",
          padding: "12px 16px",
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <Link
            href="/"
            style={{
              fontSize: 13,
              color: "#e5e7eb",
              textDecoration: "none",
            }}
          >
            ← R3 실험 홈으로
          </Link>
        </div>
        <h1>유효하지 않은 링크입니다.</h1>
      </div>
    );
  }

  /* ---------------------------------------------
     2-1) r3_hits 클릭 로그 기록
  --------------------------------------------- */
  const hitPayload: { share_id: string; message_id?: string } = {
    share_id: refCode,
  };
  if (data.message_id) hitPayload.message_id = data.message_id;

  await supabase.from("r3_hits").insert(hitPayload);

  /* ---------------------------------------------
     2-2) 이 링크의 조회수 업데이트 (views = views + 1)
  --------------------------------------------- */
  const currentViews = data.views ?? 0;
  const newViews = currentViews + 1;

  const { error: updateError } = await supabase
    .from("r3_shares")
    .update({ views: newViews })
    .eq("ref_code", refCode);

  const finalViews = updateError ? currentViews : newViews;

  /* ---------------------------------------------
     2-3) 화면에 넘겨줄 데이터
  --------------------------------------------- */
  const shareForScreen: ShareRow = {
    ...data,
    views: finalViews,
  };

  return (
    <div
      style={{
        backgroundColor: "#020617",
        minHeight: "100vh",
        color: "white",
      }}
    >
      <RedirectScreen share={shareForScreen} />
    </div>
  );
}
