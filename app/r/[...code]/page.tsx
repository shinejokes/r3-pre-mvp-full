// app/r/[code]/page.tsx
import { supabaseServer } from "../../../lib/supabaseServer";
import RedirectScreen from "./redirect-screen";

type ShareRow = {
  ref_code: string;
  title: string | null;
  target_url: string | null;
  original_url: string | null;
  views: number | null;
  hop: number | null;
};

// ✅ Next 16: params 는 Promise 이므로 타입도 Promise 로
interface PageProps {
  params: Promise<{ code: string }>;
}

// 서버 컴포넌트: Supabase에서 ref_code에 해당하는 share row 읽기
export default async function ShareRedirectPage({ params }: PageProps) {
  // ✅ 여기서 params 를 await 해서 code 추출
  const { code } = await params;

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("r3_shares")
    .select("ref_code, title, target_url, original_url, views, hop")
    .eq("ref_code", code)
    .maybeSingle<ShareRow>();

  if (error || !data) {
    return (
      <html lang="ko">
        <body
          style={{
            margin: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            backgroundColor: "#020617",
            color: "#e5e7eb",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div>
            <h1>유효하지 않은 링크입니다</h1>
            <p>공유 코드: {code}</p>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="ko">
      <body style={{ margin: 0 }}>
        {/* 클라이언트 컴포넌트에 share 정보 전달 */}
        <RedirectScreen share={data} />
      </body>
    </html>
  );
}
