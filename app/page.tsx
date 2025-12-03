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
  //
  //   나중에 r3_shares에 rider_id / rider_name 컬럼이 생기면
  //   -> Supabase 쪽에서 group by rider_id View를 만들거나
  //      여기서 직접 group-by 연산으로 교체하면 됨.
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
        maxWidth: 960,
        margin: "0 auto",
        padding: "24px 16px 40px",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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
              border: "1px solid #333",
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            내 링크 만들기
          </Link>
          <Link
            href="/lab" // 전체 실험 / 실험실 페이지 경로
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

      {/* 1. 전체 기준 Top5 (콘텐츠별 누적 조회수) */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>
          오늘 기준 Top 5 (누적 조회수, 콘텐츠별)
        </h2>
        <p style={{ fontSize: 13, color: "#777", marginBottom: 12 }}>
          Supabase <code>r3_shares</code> 테이블의 <code>views</code> 값을 기준으로
          상위 5개의 공유 링크를 보여줍니다.
          <br />
          각 항목을 클릭하면 실제 R3 중간 링크(<code>/r/[code]</code>)로
          이동합니다.
        </p>

        {globalTop.length === 0 ? (
          <EmptyCard>
            아직 조회수가 기록된 공유 링크가 없습니다.
            <br />
            먼저 <strong>“내 링크 만들기”</strong>로 링크를 생성하고 카톡 방에
            공유해 보세요.
          </EmptyCard>
        ) : (
          <RankedList items={globalTop} />
        )}
      </section>

      {/* 2. 오늘의 Top5 (임시 Rider Top5 대용) */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>
          오늘의 Top 5 (임시 Rider 랭킹)
        </h2>
        <p style={{ fontSize: 13, color: "#777", marginBottom: 12 }}>
          아직 Rider ID를 따로 저장하지 않으므로,
          <br />
          <strong>오늘 0시 이후에 생성된 중간 링크</strong>들 중에서{" "}
          <code>views</code> 값이 큰 상위 5개를 Rider 랭킹의{" "}
          <strong>임시 버전</strong>으로 사용합니다.
          <br />
          나중에 Rider 정보를 저장하게 되면, 같은 섹션을{" "}
          <strong>“전달자가 달성한 조회수 합계 기준 Top5”</strong>로 바꿀
          예정입니다.
        </p>

        {todayTop.length === 0 ? (
          <EmptyCard>
            오늘 새로 생성된 중간 링크가 아직 없습니다.
            <br />
            오늘 만든 링크가 있다면, 잠시 후 여기 Top5에 나타납니다.
          </EmptyCard>
        ) : (
          <RankedList items={todayTop} />
        )}
      </section>

      {/* 3. 최고 Hop Top5 */}
      <section>
        <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>
          최고 Hop Top 5 (네트워크 깊이)
        </h2>
        <p style={{ fontSize: 13, color: "#777", marginBottom: 12 }}>
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

// ------------------------
// 재사용 UI 컴포넌트
// ------------------------

function EmptyCard(props: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 12,
        border: "1px dashed #ccc",
        fontSize: 14,
        color: "#777",
      }}
    >
      {props.children}
    </div>
  );
}

function RankedList(props: {
  items: TopShare[];
  showHopHighlight?: boolean;
}) {
  const { items, showHopHighlight } = props;

  return (
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
      {items.map((item, index) => (
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
            <div
              style={{
                textAlign: "right",
                fontSize: 12,
                color: "#555",
                minWidth: 80,
              }}
            >
              <div>
                <strong>Views</strong> {item.views ?? 0}
              </div>
              <div
                style={
                  showHopHighlight
                    ? { fontWeight: 700 }
                    : undefined
                }
              >
                <strong>Hop</strong> {item.hop ?? 0}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ol>
  );
}
