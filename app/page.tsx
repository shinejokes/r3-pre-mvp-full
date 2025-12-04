// app/page.tsx

import Link from "next/link";
import { supabaseServer } from "../lib/supabaseServer";

type TopShare = {
  id: number;
  ref_code: string;
  title: string | null;
  views: number | null;
  hop: number | null;
  created_at: string;
};

// 60초마다 재생성 (실험용)
export const revalidate = 60;

export default async function HomePage() {
  const supabase = supabaseServer();

  // ----------------------------
  // 1) 전체 기준 Top5 (콘텐츠별 누적 조회수)
  // ----------------------------
  const { data: topSharesAll, error: errAll } = await supabase
    .from("r3_shares")
    .select("id, ref_code, title, views, hop, created_at")
    .order("views", { ascending: false })
    .limit(5);

  if (errAll) {
    console.error("Error loading global top shares:", errAll.message);
  }

  const globalTop: TopShare[] = topSharesAll ?? [];

  // ----------------------------
  // 2) 오늘의 Top5 (임시 Rider Top5)
  //
  //   아직 Rider ID가 따로 없으니,
  //   "오늘 0시 이후에 생성된 중간 링크들" 중
  //   views 기준 상위 5개를 Rider Top5의 임시버전으로 사용.
  // ----------------------------
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const { data: todaySharesRaw, error: errToday } = await supabase
    .from("r3_shares")
    .select("id, ref_code, title, views, hop, created_at")
    .gte("created_at", todayISO)
    .order("views", { ascending: false })
    .limit(5);

  if (errToday) {
    console.error("Error loading today shares:", errToday.message);
  }

  const todayTop: TopShare[] = todaySharesRaw ?? [];

  // ----------------------------
  // 3) 최고 Hop Top5
  // ----------------------------
  const { data: hopShares, error: errHop } = await supabase
    .from("r3_shares")
    .select("id, ref_code, title, views, hop, created_at")
    .order("hop", { ascending: false })
    .order("views", { ascending: false })
    .limit(5);

  if (errHop) {
    console.error("Error loading hop top shares:", errHop.message);
  }

  const hopTop: TopShare[] = hopShares ?? [];

  // ----------------------------
  // UI
  // ----------------------------
  return (
    <main
      style={{
        minHeight: "100vh",
        margin: 0,
        padding: "24px 16px 40px",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background:
          "radial-gradient(circle at 0% 0%, #3b0070 0%, #1a0033 35%, #050011 100%)",
        color: "#f9f2ff",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 960 }}>
        {/* 헤더 영역 */}
        <header style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
            R3 실험 홈
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.5, color: "#ddd" }}>
            카카오톡 등에서 퍼나르는 링크에{" "}
            <strong>조회수 · Hop</strong>을 붙여서
            <br />
            “누가 어디까지 전달했는지”를 실험하는 프로젝트입니다.
          </p>

          <div
            style={{
              marginTop: 16,
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {/* 실제 존재하는 페이지 경로에 맞게 수정해서 사용 */}
            <Link
              href="/create" // 내 링크 만들기 페이지 경로 (/create, /r 등 실제 경로로 조정)
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                border: "1px solid #f9f2ff",
                fontSize: 14,
                textDecoration: "none",
                color: "#1a0033",
                backgroundColor: "#f9f2ff",
              }}
            >
              내 링크 만들기
            </Link>
            <Link
              href="/lab" // 전체 실험 / 실험실 페이지 경로
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.6)",
                fontSize: 14,
                textDecoration: "none",
                color: "#f9f2ff",
                backgroundColor: "transparent",
              }}
            >
              전체 실험 보기
            </Link>
          </div>
        </header>

        {/* 1. 전체 기준 Top5 (콘텐츠별 누적 조회수) */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>
            오늘 기준 Top 5 (누적 조회수, 콘텐츠별)
          </h2>
          <p style={{ fontSize: 13, color: "#d0c5ff", marginBottom: 12 }}>
            Supabase <code>r3_shares</code> 테이블의 <code>views</code> 값을
            기준으로 상위 5개의 공유 링크를 보여줍니다.
            <br />
            각 항목을 클릭하면 실제 R3 중간 링크(<code>/r/[code]</code>)로
            이동합니다.
          </p>

          {globalTop.length === 0 ? (
            <EmptyCard>
              아직 조회수가 기록된 공유 링크가 없습니다.
              <br />
              먼저 <strong>“내 링크 만들기”</strong>로 링크를 생성하고 카톡
              방에 공유해 보세요.
            </EmptyCard>
          ) : (
            <RankedList items={globalTop} />
          )}
        </section>

        {/* 2. 오늘의 Top5 (엑셀 스타일 표) */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>
            오늘의 Top 5 (임시 Rider 랭킹)
          </h2>
          <p style={{ fontSize: 13, color: "#d0c5ff", marginBottom: 12 }}>
            아직 Rider ID를 따로 저장하지 않으므로,
            <br />
            <strong>오늘 0시 이후에 생성된 중간 링크</strong>들 중에서{" "}
            <code>views</code> 값이 큰 상위 5개를 Rider 랭킹의{" "}
            <strong>임시 버전</strong>으로 사용합니다.
            <br />
            아래 표는 엑셀 테이블처럼, 순위 · 제목 · 사용자 ID · 원본 URL ·
            Views · Hop을 한 줄씩 보여줍니다.
          </p>

          {todayTop.length === 0 ? (
            <EmptyCard>
              오늘 새로 생성된 중간 링크가 아직 없습니다.
              <br />
              오늘 만든 링크가 있다면, 잠시 후 여기 Top5에 나타납니다.
            </EmptyCard>
          ) : (
            <div
              style={{
                overflowX: "auto",
                borderRadius: 16,
                boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
                backgroundColor: "rgba(255,255,255,0.96)",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 14,
                  color: "#1b0033",
                }}
              >
                <thead>
                  <tr>
                    {["순위", "제목", "사용자 ID", "원본 URL", "Views", "Hop"].map(
                      (label) => (
                        <th
                          key={label}
                          style={{
                            padding: "10px 12px",
                            border: "1px solid rgba(75,0,120,0.25)",
                            background:
                              "linear-gradient(180deg, #f4e9ff 0%, #e5d5ff 100%)",
                            textAlign: "left",
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {label}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {todayTop.map((item, index) => (
                    <tr
                      key={item.id}
                      style={{
                        backgroundColor:
                          index % 2 === 0
                            ? "rgba(250,244,255,0.95)"
                            : "rgba(255,255,255,0.95)",
                      }}
                    >
                      {/* 순위 */}
                      <td
                        style={{
                          padding: "8px 12px",
                          border: "1px solid rgba(75,0,120,0.15)",
                          textAlign: "center",
                        }}
                      >
                        {index + 1}
                      </td>

                      {/* 제목 (중간 링크로 연결) */}
                      <td
                        style={{
                          padding: "8px 12px",
                          border: "1px solid rgba(75,0,120,0.15)",
                          maxWidth: 260,
                          textOverflow: "ellipsis",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          fontWeight: 500,
                        }}
                        title={item.title ?? undefined}
                      >
                        <Link
                          href={`/r/${item.ref_code}`}
                          style={{
                            textDecoration: "none",
                            color: "#2b0060",
                          }}
                        >
                          {item.title || "(제목 없음)"}
                        </Link>
                      </td>

                      {/* 사용자 ID – 아직 없으므로 빈칸 */}
                      <td
                        style={{
                          padding: "8px 12px",
                          border: "1px solid rgba(75,0,120,0.15)",
                        }}
                      >
                        {/* TODO: 나중에 rider_id / user_id 컬럼 연결 */}
                      </td>

                      {/* 원본 URL – 현재는 shares 테이블에서 직접 가져오지 못하므로 임시로 '-' */}
                      <td
                        style={{
                          padding: "8px 12px",
                          border: "1px solid rgba(75,0,120,0.15)",
                          maxWidth: 260,
                          textOverflow: "ellipsis",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                        }}
                        title={"-"}
                      >
                        -
                      </td>

                      {/* Views */}
                      <td
                        style={{
                          padding: "8px 12px",
                          border: "1px solid rgba(75,0,120,0.15)",
                          textAlign: "right",
                        }}
                      >
                        {item.views ?? 0}
                      </td>

                      {/* Hop */}
                      <td
                        style={{
                          padding: "8px 12px",
                          border: "1px solid rgba(75,0,120,0.15)",
                          textAlign: "right",
                        }}
                      >
                        {item.hop ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 3. 최고 Hop Top5 */}
        <section>
          <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>
            최고 Hop Top 5 (네트워크 깊이)
          </h2>
          <p style={{ fontSize: 13, color: "#d0c5ff", marginBottom: 12 }}>
            각 공유 링크의 <code>hop</code> 값을 기준으로,
            <br />
            네트워크를 가장 깊게 파고든 링크 상위 5개를 보여줍니다.{" "}
            <strong>Views</strong>로 동률을 정리합니다.
          </p>

          {hopTop.length === 0 ? (
            <EmptyCard>
              아직 Hop 정보가 기록된 링크가 없습니다.
              <br />
              링크가 중간 전달자들을 거치면 Hop 값이 증가합니다.
            </EmptyCard>
          ) : (
            <RankedList items={hopTop} showHopHighlight />
          )}
        </section>

        {/* 푸터 */}
        <footer
          style={{
            marginTop: 40,
            fontSize: 11,
            color: "#b9a9ff",
            borderTop: "1px solid rgba(255,255,255,0.18)",
            paddingTop: 12,
          }}
        >
      R3 Demo · 실험용 버전 · Supabase + Next.js
        </footer>
      </div>
    </main>
  );
}



// ------------------------
// 재사용 UI 컴포넌트
// ------------------------

function EmptyCard(props: { children: React.ReactNode }) {
  return (
    <div> ... </div>
  );
}

function RankedList(props: { items: TopShare[]; showHopHighlight?: boolean }) {
  return (
    <ol> ... </ol>
  );
}


