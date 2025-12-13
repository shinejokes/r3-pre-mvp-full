// app/page.tsx

import Link from "next/link";
import type { ReactNode } from "react";
import { supabaseServer } from "../lib/supabaseServer";

type TopShare = {
  id: number;
  ref_code: string;
  title: string | null;
  original_url: string | null;
  views: number | null;
  hop: number | null;
  created_at: string;
};

// 60초마다 재생성 (실험용)
export const revalidate = 60;

export default async function HomePage() {
  const supabase = supabaseServer();

  // 1) 전체 기준 Top Views 5
  const { data: topSharesAll, error: errAll } = await supabase
    .from("r3_shares")
    .select(
      "id, ref_code, title, original_url, views, hop, created_at"
    )
    .order("views", { ascending: false })
    .limit(5);

  if (errAll) {
    console.error("Error loading global top shares:", errAll.message);
  }

  const globalTop: TopShare[] = topSharesAll ?? [];

  // 2) 오늘의 Top Rider 5 (오늘 0시 이후 생성된 링크 기준)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const { data: todaySharesRaw, error: errToday } = await supabase
    .from("r3_shares")
    .select(
      "id, ref_code, title, original_url, views, hop, created_at"
    )
    .gte("created_at", todayISO)
    .order("views", { ascending: false })
    .limit(5);

  if (errToday) {
    console.error("Error loading today shares:", errToday.message);
  }

  const todayTop: TopShare[] = todaySharesRaw ?? [];

  // 3) 최고 Hop Top5
  const { data: hopShares, error: errHop } = await supabase
    .from("r3_shares")
    .select(
      "id, ref_code, title, original_url, views, hop, created_at"
    )
    .order("hop", { ascending: false })
    .order("views", { ascending: false })
    .limit(5);

  if (errHop) {
    console.error("Error loading hop top shares:", errHop.message);
  }

  const hopTop: TopShare[] = hopShares ?? [];

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
        {/* 헤더 */}
        <header style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
            R3 홈페이지(임시)
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.5, color: "#ddd" }}>
            카카오톡, LINE 등에서 퍼나르는 링크에
            <strong> 조회수 · Hop</strong>을 붙여서
            “누가 얼마나 많이 전달했는지”를 실험하는 프로젝트입니다.
          </p>

          <div
            style={{
              marginTop: 16,
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
<Link
  href="/r"
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
  콘텐츠 등록하기
</Link>

          </div>
        </header>

        {/* 1. 오늘의 Top Views 5 */}
        <section style={{ marginBottom: 32 }}>
<h2
  style={{
    fontSize: 22,
    fontWeight: 600,
    marginBottom: 12,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  }}
>
  오늘의 Top Views 5(조회수)
</h2>

          <p style={{ fontSize: 13, color: "#d0c5ff", marginBottom: 12 }}>
         오늘 가장 많이 본 링크 5개입니다. 제목을 누르면 중간전달자 화면으로 이동합니다.
         </p>


          {globalTop.length === 0 ? (
            <EmptyCard>
              아직 조회수가 기록된 공유 링크가 없습니다.
              <br />
              먼저 <strong>“내 링크 만들기”</strong>로 링크를 생성하고 카톡
              방에 공유해 보세요.
            </EmptyCard>
          ) : (
            <RankingTable
              items={globalTop}
              headerLabels={[
                "순위",
                "제목",
                "사용자 ID",
                "원본 URL",
                "Views",
                "Hop",
              ]}
            />
          )}
        </section>

        {/* 2. 오늘의 Top Rider 5 */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>
            오늘의 Top Rider 5 (임시)
          </h2>
          <p style={{ fontSize: 13, color: "#d0c5ff", marginBottom: 12 }}>
            중간전달자(Rider)가 기여한 조회수 기준입니다. </p>

          {todayTop.length === 0 ? (
            <EmptyCard>
              오늘 새로 생성된 중간 링크가 아직 없습니다.
              <br />
              오늘 만든 링크가 있다면, 잠시 후 여기 Top Rider 5에 나타납니다.
            </EmptyCard>
          ) : (
            <RankingTable
              items={todayTop}
              headerLabels={[
                "순위",
                "제목",
                "사용자 ID",
                "원본 URL",
                "My Views",
                "Hop",
              ]}
            />
          )}
        </section>

        {/* 3. 오늘의 Top Hop 5 */}
        <section>
          <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>
            오늘의 Top Hop 5 (전달 깊이)
          </h2>
          <p style={{ fontSize: 13, color: "#d0c5ff", marginBottom: 12 }}>
           Hop은 몇 사람을 거쳐 전달되었느냐를 나타냅니다. </p>

          {hopTop.length === 0 ? (
            <EmptyCard>
              아직 Hop 정보가 기록된 링크가 없습니다.
              <br />
              링크가 중간 전달자들을 거치면 Hop 값이 증가합니다.
            </EmptyCard>
          ) : (
            <RankingTable
              items={hopTop}
              headerLabels={[
                "순위",
                "제목",
                "사용자 ID",
                "원본 URL",
                "Views",
                "Hop",
              ]}
            />
          )}
        </section>

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

function EmptyCard(props: { children: ReactNode }) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 12,
        border: "1px dashed rgba(230,215,255,0.9)",
        fontSize: 14,
        color: "#e0d4ff",
        backgroundColor: "rgba(10,0,40,0.4)",
      }}
    >
      {props.children}
    </div>
  );
}

/** 공통 테이블 – 원본 URL까지 포함해서 렌더링 */
function RankingTable(props: {
  items: TopShare[];
  headerLabels: string[];
}) {
  const { items, headerLabels } = props;

  return (
    <div
      style={{
        overflowX: "auto",
        borderRadius: 16,
        boxShadow: "0 0 0 1px rgba(249,242,255,0.18)",
        backgroundColor: "transparent",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 14,
          color: "#f9f2ff",
          backgroundColor: "transparent",
        }}
      >
        <thead>
          <tr>
            {headerLabels.map((label) => (
              <th
                key={label}
                style={{
                  padding: "10px 12px",
                  border: "1px solid rgba(249,242,255,0.35)",
                  backgroundColor: "rgba(5,0,25,0.95)",
                  textAlign: "center",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr
              key={item.id}
              style={{
                backgroundColor:
                  index % 2 === 0
                    ? "rgba(255,255,255,0.02)"
                    : "rgba(255,255,255,0.05)",
              }}
            >
              {/* 순위 */}
              <td
                style={{
                  padding: "8px 12px",
                  border: "1px solid rgba(249,242,255,0.25)",
                  textAlign: "center",
                }}
              >
                {index + 1}
              </td>

              {/* 제목 */}
              <td
                style={{
                  padding: "8px 12px",
                  border: "1px solid rgba(249,242,255,0.25)",
                  maxWidth: 260,
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  fontWeight: 500,
                  textAlign: "center",
                }}
                title={item.title ?? undefined}
              >
                <Link
                  href={`/r/${item.ref_code}`}
                  style={{
                    textDecoration: "none",
                    color: "#ffe8ff",
                  }}
                >
                  {item.title || "(제목 없음)"}
                </Link>
              </td>

              {/* 사용자 ID – 아직 없음 */}
              <td
                style={{
                  padding: "8px 12px",
                  border: "1px solid rgba(249,242,255,0.25)",
                  textAlign: "center",
                }}
              />

              {/* 원본 URL */}
              <td
                style={{
                  padding: "8px 12px",
                  border: "1px solid rgba(249,242,255,0.25)",
                  maxWidth: 260,
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textAlign: "center",
                }}
                title={item.original_url ?? undefined}
              >
                {item.original_url ? (
                  <a
                    href={item.original_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#b3e6ff", textDecoration: "none" }}
                  >
                    {item.original_url}
                  </a>
                ) : (
                  "-"
                )}
              </td>

              {/* Views / My Views */}
              <td
                style={{
                  padding: "8px 12px",
                  border: "1px solid rgba(249,242,255,0.25)",
                  textAlign: "center",
                }}
              >
                {item.views ?? 0}
              </td>

              {/* Hop */}
              <td
                style={{
                  padding: "8px 12px",
                  border: "1px solid rgba(249,242,255,0.25)",
                  textAlign: "center",
                }}
              >
                {item.hop ?? 0}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
