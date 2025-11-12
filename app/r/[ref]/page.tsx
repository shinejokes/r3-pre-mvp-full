// app/r/[ref]/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = { ref: string };

export async function generateMetadata({ params }: { params: Params }) {
  const site =
    process.env.NEXT_PUBLIC_SITE_URL || "https://r3-pre-mvp-full.vercel.app";
  const ref = params.ref || "NO_PARAM";
  const title = `R3 v8 • ${ref}`;
  const img = `${site}/api/ogimage?shareId=${encodeURIComponent(ref)}&v=8`;
  const url = `${site}/r/${encodeURIComponent(ref)}`;

  return {
    title,
    description: "R3 Link Preview",
    alternates: { canonical: url },
    openGraph: {
      title,
      description: "R3 Link Preview",
      url,
      type: "article",
      images: [{ url: img, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: "R3 Link Preview",
      images: [img],
    },
  };
}

export default function RRef({ params }: { params: Params }) {
  return (
    <main style={{ padding: 24 }}>
      <h1>R3 preview (safe mode)</h1>
      <p>
        ref: <b>{params.ref}</b>
      </p>
      <p style={{ opacity: 0.6 }}>
        진단용으로 항상 200을 반환합니다. (봇/사람 구분 없음)
      </p>
    </main>
  );
}
