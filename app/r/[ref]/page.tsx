// app/r/[ref]/page.tsx

import { supabaseServer } from "../../../lib/supabaseServer";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

type PageProps = {
  params?: {
    ref?: string;
  };
};

export default async function RedirectPage({ params }: PageProps) {
  const supabase = supabaseServer();

  // 1) Next가 넘겨 준 params.ref 사용
  let ref = params?.ref;

  // 2) params가 비어 있으면, 헤더에서 경로를 직접 파싱
  if (!ref) {
    const h = await headers(); // ★ 여기서 Promise를 실제 헤더 객체로 받음

    const rawPath =
      h.get("x-invoke-path") ||
      h.get("x-matched-path") ||
      h.get("next-url") ||
      "";

    // 보통 "/r/RCgm2oo" 같은 형태 → ["r", "RCgm2oo"]
    const parts = rawPath.split("/").filter(Boolean);

    if (parts.length >= 2 && parts[0] === "r") {
      ref = parts[1];
    }
  }

  // ref 자체를 못 얻으면 디버그 화면
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
            fontFamily: "monospace",
          }}
        >
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>DEBUG: no ref</h1>
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
              },
              null,
              2
            )}
          </pre>
        </div>
      </main>
    );
  }

  // ref_code로 share 찾기
  const { data: share, error } = await supabase
    .from("r3_shares")
    .select("id, target_url, ref_code")
    .eq("ref_code", ref)
    .maybeSingle();

  // 못 찾았거나 에러이면 안내 + 디버그 출력
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
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 16 }}>
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

  // 정상이면 hits 기록
  await supabase.from("r3_hits").insert({ share_id: share.id });

  // 그리고 원본으로 이동
  redirect(share.target_url);
}
