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
  message_id: string | null; // ✅ 원본 메시지 ID
};

interface PageParams {
  code: string[];
}

interface PageProps {
  params: Promise<PageParams>; // ✅ 이 프로젝트에서는 Promise 형태
}

function extractRefCode(code: string[] | string): string {
  return Array.isArray(code) ? code[0] : code;
}

// ---------- 메타데이터(OG 이미지) ----------
export async function generateMetadata(
  { params }: PageProps
): Promise<Metadata> {
  const resolved = await params; // ✅ 먼저 풀어주고
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
  const resolved = await params; // ✅ 여기서도 먼저 resolve
  const refCode = extractRefCode(resolved.code);

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("r3_shares")
    .select(
      "ref_code, title, target_url, original_url, views, hop, message_id"
    )
    .eq("ref_code", refCode)
    .maybeSingle<ShareRow>();

  if (error || !data) {
    console.error("Share not found or Supabase error", { refCode, error });

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

  // 1) 클릭 로그: r3_hits에 share_id + message_id 기록
  const hitPayload: { share_id: string; message_id?: string } = {
    share_id: refCode,
  };
  if (data.message_id) {
    hitPayload.message_id = data.message_id;
  }

  const { error: hitError } = await supabase
    .from("r3_hits")
    .insert(hitPayload);

  if (hitError) {
    console.error("Failed to insert hit", hitError);
  }

  // 2) 이 공유 링크 자체의 views 컬럼도 +1 (기존 동작 유지)
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

  // 3) message_id 기준 "원본 전체 조회수" 계산
  let originalTotalViews = updatedShare.views ?? 0;

  if (updatedShare.message_id) {
    const { count, error: countError } = await supabase
      .from("r3_hits")
      .select("id", { count: "exact", head: true })
      .eq("message_id", updatedShare.message_id);

    if (!countError && typeof count === "number") {
      originalTotalViews = count;
    }
  }

  // 4) 중간 화면에는 원본 기준 조회수를 넘겨준다
  const shareForScreen: ShareRow = {
    ...updatedShare,
    views: originalTotalViews,
  };

  return <RedirectScreen share={shareForScreen} />;
}

