// app/r/[ref]/page.tsx  (디버그 버전)

import { supabaseServer } from "../../../lib/supabaseServer";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: {
    ref: string;
  };
};

export default async function RedirectPage({ params }: PageProps) {
  const supabase = supabaseServer();

  const { data: share, error } = await supabase
    .from("r3_shares")
    .select("id, target_url, ref_code")
    .eq("ref_code", params.ref)
    .maybeSingle();

  // 🔍 디버그: 결과가 없거나 에러일 때 자세한 정보 표시
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
            padding: "24px 32px",
            borderRadius: "24px",
            boxShadow: "0 20px 40px rgba(15,23,42,0.08)",
            backgroundColor: "white",
            maxWidth: "800px",
            width: "100%",
            fontFamily: "monospace",
          }}
        >
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>DEBUG: share not found</h1>
          <p style={{ fontSize: 13, marginBottom: 16 }}>
            이 화면을 스크린샷해서 나에게 보내 주면 원인을 정확히 진단할 수 있네.
          </p>

          <pre
            style={{
              fontSize: 12,
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              backgroundColor: "#0f172a",
              color: "#e5e7eb",
              padding: 16,
              borderRadius: 12,
              maxHeight: 400,
              overflow: "auto",
            }}
          >
{JSON.stringify(
  {
    params,
    error,
    share,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  },
  null,
  2
)}
          </pre>
        </div>
      </main>
    );
  }

  // 정상인 경우: hits 기록 후 리다이렉트
  await supabase.from("r3_hits").insert({ share_id: share.id });
  redirect(share.target_url);
}
