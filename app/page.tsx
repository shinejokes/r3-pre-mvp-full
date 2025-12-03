// app/page.tsx

import Link from "next/link";
import { supabaseServer } from "../lib/supabaseServer"; // 경로가 ../lib인지 ./lib인지 프로젝트 구조에 맞게 조정

type TopShare = {
  id: number;
  ref_code: string;
  title: string | null;
  views: number | null;
  hop: number | null;
  created_at: string;
};

export const revalidate = 60; 
// 60초마다 ISR 재생성: Supabase 값이 변해도 너무 자주 안 만들도록 (원하면 줄이거나 늘려도 됨)

export default async function HomePage() {
  const supabase = supabaseServer();

  // 1) 누적 조회수 기준 상위 5개 가져오기
  const { data: topShares, error } = await supabase
    .from("r3_shares")
    .select("id, ref_code, title, views, hop, created_at")
    .order("views", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error loading top shares:", error.message);
  }

  const list: TopShare[] = topShares ?? [];

  return (
    <main
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "24px 16px 40px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* 헤더 영역 */}
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
          R3 실험 홈
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.5, color: "#555" }}>
          카카오톡 등에서 퍼나르는 링크에{" "}
          <strong>조회수 · Hop</strong>을 붙여서
          <br />
          “누가 어디까지 전달했는지”를 실험하는 프로젝트입니다.
        </p>

        <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {/* 실제 존재하는 페이지 경로에 맞게 수정 */}
          <Link
            href="/r" // 예: 내 링크 만들기 랜딩 페이지가 /r 이라면 그대로, 다른 경로면 바꿔주세.
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: "1px solid #333",
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            내 링크 만들기
          </Link>
          <Link
            href="/lab" // 전체 목록, 실험실 페이지가 따로 있으면 그 경로로 수정
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: "1px solid #ccc",
              fontSize: 14,
              textDecoration: "none",
              color: "#555",
            }}
          >
            전체 실험 보기
          </Link>
        </div>
      </header>

      {/* 오늘 기준 Top 5 (누적 조회수 상위) */}
      <section>
        <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>
          오늘 기준 Top 5 (누적 조회수)
        </h2>
        <p style={{ fontSize: 13, color: "#777", marginBottom: 12 }}>
          Supabase <code>r3_shares</code> 테이블의 <code>views</code> 값을 기준으로
          상위 5개의 공유 링크를 보여줍니다.
          <br />
          각 항목을 클릭하면 실제 R3 중간 링크(<code>/r/[code]</code>)로 이동합니다.
        </p>

        {list.length === 0 ? (
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              border: "1px dashed #ccc",
              fontSize: 14,
              color: "#777",
            }}
          >
            아직 조회수가 기록된 공유 링크가 없습니다.
            <br />
            먼저 <strong>“내 링크 만들기”</strong>로 링크를 생성하고 카톡 방에 공유해 보세요.
          </div>
        ) : (
          <ol
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {list.map((item, index) => (
              <li key={item.id}>
                <Link
                  href={`/r/${item.ref_code}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid #eee",
                    textDecoration: "none",
                    background: "#fafafa",
                  }}
                >
                  {/* 순위 동그라미 */}
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      border: "1px solid #ddd",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    {index + 1}
                  </div>

                  {/* 제목 + 코드 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        marginBottom: 4,
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                      }}
                    >
                      {item.title || "(제목 없음)"}
                    </div>
                    <div style={{ fontSize: 12, color: "#888" }}>
                      코드: <code>{item.ref_code}</code>
                    </div>
                  </div>

                  {/* 조회수 / Hop */}
                  <div style={{ textAlign: "right", fontSize: 12, color: "#555" }}>
                    <div>
                      <strong>Views</strong>{" "}
                      {item.views ?? 0}
                    </div>
                    <div>
                      <strong>Hop</strong>{" "}
                      {item.hop ?? 0}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* 푸터 */}
      <footer
        style={{
          marginTop: 40,
          fontSize: 11,
          color: "#aaa",
          borderTop: "1px solid #eee",
          paddingTop: 12,
        }}
      >
        R3 Demo · 실험용 버전 · Supabase + Next.js
      </footer>
    </main>
  );
}

