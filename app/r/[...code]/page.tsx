// app/r/[...code]/page.tsx

import { supabaseServer } from "../../../lib/supabaseServer";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function RedirectPage() {
  const supabase = supabaseServer();

  // 🔹 미들웨어에서 넣어 준 ref 코드 읽기
  const h = await headers(); // ← 여기서 Promise를 실제 헤더 객체로 받음
  const ref = h.get("x-r3-ref");

  // ref가 없으면 디버그 화면
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
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>
            DEBUG: no ref from header
          </h1>
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
    "x-r3-ref": ref,
  },
  null,
  2
)}
          </pre>
        </div>
      </main>
    );
  }

  // 🔹 Supabase에서 ref_code로 share 찾기
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

  // 🔹 찾았으면 hits 증가
  await supabase.from("r3_hits").insert({ share_id: share.id });

  // 🔹 그리고 원본으로 이동
  redirect(share.target_url);
}
