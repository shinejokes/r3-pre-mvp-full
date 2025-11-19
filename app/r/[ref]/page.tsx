// app/r/[ref]/page.tsx
import { Metadata } from "next";
import ShareActions from "./ShareActions";

type PageProps = {
  params: {
    ref: string;
  };
};

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://r3-pre-mvp-full.vercel.app";

// 🔹 Supabase를 전혀 쓰지 않는 간단한 메타데이터
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const title = "R3 공유 링크";
  const description = `이 링크는 R3 공유 링크입니다. (ref: ${params.ref})`;

  // ref 값을 그대로 shareId로 넣어 주면,
  // /api/ogimage 안에서 Supabase를 읽고 썸네일을 만들어 줌
  const ogImageUrl = `${BASE_URL}/api/ogimage?shareId=${params.ref}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

// 🔹 실제 페이지도 Supabase 없이 ref 값만 사용
export default function SharePage({ params }: PageProps) {
  const { ref } = params;

  return (
    <main
      style={{
        padding: 24,
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        maxWidth: 800,
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>R3 메시지 프리뷰</h1>

      <p style={{ marginBottom: 8, fontSize: 14, color: "#555" }}>
        이 페이지는 <code>{ref}</code> 에 해당하는 R3 공유 링크입니다.
      </p>
      <p style={{ marginBottom: 16, fontSize: 13, color: "#777" }}>
        아래 &quot;내 링크 만들기&quot; 버튼을 누르면, 이 링크를 이어받는 새
        공유 링크가 생성됩니다.
      </p>

      {/* 이제는 DB를 안 읽기 때문에, URL 안의 ref 값을 그대로 넘겨줌 */}
      <ShareActions refCode={ref} />
    </main>
  );
}
