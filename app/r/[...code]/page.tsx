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
  views: number | null;     // 전체 조회수 (Original Total Views)
  hop: number | null;
  message_id: string | null;
  self_views?: number | null; // 내 링크 조회수 (MV)
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
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = await params;
  const refCode = extractRefCode(resolved.code);

  const supabase = supabaseServer();
  const { data } = await supabase
    .from("r3_shares")
    .select("title")
    .eq("ref_code", refCode)
    .maybeSingle();

  const title = data?.title || "R³ Hand-Forwarded Link";

  const base = process.env.R3_APP_BASE_URL || "https://r3-pre-mvp-full.vercel.app";
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
    .select("ref_code, title, target_url, original_url, views, hop, message_id")
    .eq("ref_code", refCode)
    .maybeSingle<ShareRow>();

  if (error || !data) {
    return (
      <div style={{ backgroundColor: "#020617", height: "100vh", color: "white" }}>
        <h1>유효하지 않은 링크입니다.</h1>
      </div>
    );
  }

  /* ---------------------------------------------
     2-1) r3_hits 클릭 로그 기록
  --------------------------------------------- */
  const hitPayload: { share_id: string; message_id?: string } = { share_id: refCode };
  if (data.message_id) hitPayload.message_id = data.message_id;

  await supabase.from("r3_hits").insert(hitPayload);


  /* ---------------------------------------------
     2-2) 내 링크의 조회수 (MV) 계산 = 기존 views + 1
  --------------------------------------------- */
  const currentViews = data.views ?? 0;

  const { error: updateError } = await supabase
    .from("r3_shares")
    .update({ views: currentViews + 1 })
    .eq("ref_code", refCode);

  const selfViews = updateError ? currentViews : currentViews + 1;


  /* ---------------------------------------------
     2-3) message_id 기준 전체 조회수 (Original Total Views)
  --------------------------------------------- */
  let totalViews = 0;

  if (data.message_id) {
    const { count } = await supabase
      .from("r3_hits")
      .select("id", { count: "exact", head: true })
      .eq("message_id", data.message_id);

    totalViews = count ?? 0;
  }


  /* ---------------------------------------------
     2-4) 최종 전달할 데이터 구조
  --------------------------------------------- */
  const shareForScreen: ShareRow = {
    ...data,
    views: totalViews,   // 전체 조회수
    self_views: selfViews, // 내 링크 조회수
  };

  return <RedirectScreen share={shareForScreen} />;
}
