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

  let ref = params?.ref;

  // params가 비어 있으면 헤더에서 경로를 직접 읽어온다
  if (!ref) {
    const h = await headers();

    const invokePath = h.get("x-invoke-path") || null;
    const matchedPath = h.get("x-matched-path") || null;
    const nextUrl = h.get("next-url") || null;

    // 가장 실제 URL에 가까운 next-url을 우선 사용
    const rawPath = (nextUrl || invokePath || matchedPath || "") as string;

    // 쿼리스트링 제거 후 분해: "/r/RCgm2oo?x=y" -> ["r", "RCgm2oo"]
    const pathOnly = rawPath.split("?")[0];
    const parts = pathOnly.split("/").filter(Boolean);

    if (parts.length >= 2 && parts[0] === "r") {
      ref = parts[1];
    }

    // 디버그용: ref가 여전히 없을 경우 상황을 보여준다
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
    invokePath,
    matchedPath,
    nextUrl,
    rawPath,
  },
  null,
  2
)}
            </pre>
          </div>
        </main>
      );
    }
  }

  // 여기까지 왔다면 ref에는 최소한 뭔가 값이 들어 있음
  const { data: share, error } = await supabase
    .from("r3_shares")
    .select("id, target_url, ref_code")
    .eq("ref_code", ref as string)
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

  await supabase.from("r3_hits").insert({ share_id: share.id });

  redirect(share.target_url);
}
