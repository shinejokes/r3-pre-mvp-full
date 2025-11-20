// app/r/[...code]/page.tsx

import { supabaseServer } from "../../../lib/supabaseServer";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: {
    code: string[]; // /r/RCgm2oo -> ["RCgm2oo"]
  };
};

export default async function RedirectPage({ params }: PageProps) {
  const supabase = supabaseServer();

  // 첫 번째 세그먼트를 ref_code로 사용
  const ref = params.code[0];

  // ref가 없으면 바로 에러 화면
  if (!ref) {
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
            boxShadow: "0 20px 40px rgba(15, 23, 42, 0.08)",
            backgroundColor: "white",
            maxWidth: 800,
            width: "100%",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>링크를 찾을 수 없습니다</h1>
          <p style={{ fontSize: 14, color: "#64748b" }}>
            잘못된 링크이거나, 삭제된 링크일 수 있습니다. (ref 없음)
          </p>
        </div>
      </main>
    );
  }

  // Supabase에서 ref_code로 share 찾기
  const { data: share, error } = await supabase
    .from("r3_shares")
    .select("id, target_url")
    .eq("ref_code", ref)
    .maybeSingle();

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
            boxShadow: "0 20px 40px rgba(15, 23, 42, 0.08)",
            backgroundColor: "white",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            링크를 찾을 수 없습니다
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 12 }}>
            잘못된 링크이거나, 삭제된 링크일 수 있습니다.
          </p>
          <pre
            style={{
              fontSize: 11,
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              backgroundColor: "#0f172a",
              color: "#e5e7eb",
              padding: 12,
              borderRadius: 8,
              maxHeight: 260,
              overflow: "auto",
              textAlign: "left",
            }}
          >
            {JSON.stringify(
              {
                refTried: ref,
                error,
                share,
              },
              null,
              2
            )}
          </pre>
        </div>
      </main>
    );
  }

  // 찾았으면 hits 증가
  await supabase.from("r3_hits").insert({ share_id: share.id });

  // 그리고 원본으로 이동
  redirect(share.target_url);
}
