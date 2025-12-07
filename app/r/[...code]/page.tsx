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
  views: number | null;        // 이 링크의 조회수 또는 전체 조회수(아래서 덮어씀)
  hop: number | null;
  message_id: string | null;

  // RedirectScreen에서 쓸 수 있도록 추가 필드
  myViews?: number | null;     // 이 링크(My R³ 링크)의 조회수
  totalViews?: number | null;  // 같은 message_id 묶음의 총 조회수
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
// app/r/[code]/page.tsx 중 일부

type Props = {
  params: { code: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const refCode = params.code;

 const supabase = supabaseServer(); // ← 추가
const { data } = await supabase    // ← 여기서 supabase 사용

    .from("r3_shares")
    .select("title")
    .eq("ref_code", refCode)
    .single();

  const title = data?.title ?? "R3 소개";
  const description = "여기를 눌러 링크를 확인하세요.";

  const baseUrl =
    process.env.R3_APP_BASE_URL ?? "https://r3-pre-mvp-full.vercel.app";

  const pageUrl = `${baseUrl}/r/${refCode}`;
  // const ogImageUrl = `${baseUrl}/api/ogimage?shareId=${refCode}`; 원래
const ogImageUrl = `${baseUrl}/api/ogimage?shareId=${refCode}&v=2`;


  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
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

// 아래 실제 페이지 컴포넌트 부분은 기존 그대로 두면 됩니다.


/* ---------------------------------------------
   2) MAIN PAGE LOGIC
--------------------------------------------- */
export default async function ShareRedirectPage({ params }: PageProps) {
  const resolved = await params;
  const refCode = extractRefCode(resolved.code);

  const supabase = supabaseServer();

  // 2-1. 해당 공유 링크 정보 읽기
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

  // 2-2. r3_hits 클릭 로그 남기기
  const hitPayload: { share_id: string; message_id?: string } = {
    share_id: refCode,
  };
  if (data.message_id) hitPayload.message_id = data.message_id;

  await supabase.from("r3_hits").insert(hitPayload);

  // 2-3. 이 링크의 조회수(My Views) 업데이트: views = views + 1
  const currentViews = data.views ?? 0;
  const myViews = currentViews + 1;

  let finalMyViews = currentViews;

  const { error: updateError } = await supabase
    .from("r3_shares")
    .update({ views: myViews })
    .eq("ref_code", refCode);

  if (!updateError) {
    finalMyViews = myViews;
  }

  // 2-4. 같은 message_id를 가진 모든 share의 views를 합쳐서 totalViews 계산
  let totalViews = finalMyViews;

  if (data.message_id) {
    const { data: siblings, error: sumError } = await supabase
      .from("r3_shares")
      .select("views")
      .eq("message_id", data.message_id);

    if (!sumError && siblings) {
      totalViews = siblings.reduce(
        (sum, row) => sum + (row.views ?? 0),
        0
      );
    }
  }

  // 2-5. RedirectScreen으로 넘길 객체 구성
  const shareForScreen: ShareRow = {
    ...data,
    views: totalViews,       // "Views" 용
    myViews: finalMyViews,   // "My Views" 용
    totalViews: totalViews,  // 혹시 다른 이름을 쓴다면 대비용
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
