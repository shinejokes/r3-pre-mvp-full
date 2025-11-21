import { ImageResponse } from "next/og";
import { supabaseServer } from "../../../lib/supabaseServer";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const shareId = searchParams.get("shareId");

  if (!shareId) {
    return new Response("Missing shareId", { status: 400 });
  }

  // 🔹 Supabase에서 데이터 읽기
  const supabase = supabaseServer();
  const { data: shareData } = await supabase
    .from("r3_shares")
    .select("title, views, hop, thumbnail_url")
    .eq("ref_code", shareId)
    .single();

  if (!shareData) {
    return new Response("Invalid shareId", { status: 404 });
  }

  const { title, views, hop, thumbnail_url } = shareData;

  // 🔹 OG 이미지 렌더링
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0b172a",
          fontFamily: "Pretendard, sans-serif",
          position: "relative",
        }}
      >
        {/* ▶ 상단 라벨 제거됨 */}

        {/* ▶ 제목 (조금 더 작게: 34px) */}
        <div
          style={{
            fontSize: "34px",
            fontWeight: 600,
            color: "white",
            paddingTop: "50px",
            paddingLeft: "70px",
          }}
        >
          {title}
        </div>

        {/* ▶ 원본 썸네일 */}
        <img
          src={thumbnail_url}
          style={{
            width: "1060px",
            height: "420px",
            margin: "40px auto 0 auto",
            objectFit: "cover",
            borderRadius: "24px",
          }}
        />

        {/* ▶ 아래 R3 박스 (폰트 크게 + 고대비) */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: "40px",
            padding: "16px 40px",
            background: "rgba(0, 0, 0, 0.45)",
            borderRadius: "40px",
            fontSize: "30px", // ← **가장 중요한 부분: 크게 증가**
            fontWeight: 800,   // ← 굵게
            color: "white",
          }}
        >
          <span style={{ color: "#4aa8ff" }}>R3</span>
          <span>Views {views}</span>
          <span>Hop {hop}</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
