// app/r/[ref]/page.tsx

import { supabaseServer } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: {
    // /r/RCgm2oo → params.ref === "RCgm2oo"
    ref: string;
  };
};

export default async function RedirectPage({ params }: PageProps) {
  const supabase = supabaseServer();

  // ★ ref_code 컬럼으로 share 찾기
  const { data: share, error } = await supabase
    .from("r3_shares")
    .select("id, target_url")
    .eq("ref_code", params.ref)
    .maybeSingle();

  // 못 찾았거나 에러이면 "링크를 찾을 수 없습니다" 화면
  if (!share || error || !share.target_url) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
        }}
      >
        <div
          style={{
            padding: "32px 40px",
            borderRadius: "24px",
            boxShadow: "0 20px 40px rgba(15,23,42,0.08)",
            backgroundColor: "white",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>
            링크를 찾을 수 없습니다
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b" }}>
            잘못된 링크이거나, 삭제된 링크일 수 있습니다.
          </p>
        </div>
      </main>
    );
  }

  // 찾았으면 hits에 기록 남기기
  await supabase.from("r3_hits").insert({ share_id: share.id });

  // 그리고 원본 링크로 리다이렉트
  redirect(share.target_url);
}
