// app/r/[...code]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { supabaseServer } from "../../../lib/supabaseServer";
import RedirectScreen from "./redirect-screen";

export const dynamic = "force-dynamic";

type ShareRow = {
  ref_code: string;
  title: string | null;
  target_url: string | null;
  original_url: string | null;
  views: number | null;        // 이 링크의 조회수 또는 전체 조회수(아래서 덮어씀)
  hop: number | null;
  message_id: string | null;

  // RedirectScreen에서 쓸 수 있도록 추가 필드
  myViews?: number | null;     // 이 링크(My R³ 링크)의 조회수
  totalViews?: number | null;  // 같은 message_id 묶음의 총 조회수
};

interface PageParams {
  code: string[];
}

interface PageProps {
  params: PageParams;
}

function extractRefCode(code: string[] | string): string {
  return Array.isArray(code) ? code[0] : code;
}

/* ---------------------------------------------
   1) OG IMAGE META
--------------------------------------------- */

type MetadataProps = {
  params: { code: string[] };   // [...code] 라우트에 맞게 배열 타입
};

export async function generateMetadata(
  { params }: MetadataProps
): Promise<Metadata> {
  // 항상 첫 번째 조각을 refCode로 사용
  const refCode = extractRefCode(params.code);

  const supabase = supabaseServer();
  const { data } = await supabase
    .from("r3_shares")
    .select("title")
    .eq("ref_code", refCode)
    .maybeSingle();

  const title = data?.title ?? "R3 소개";
  const description = "여기를 눌러 링크를 확인하세요.";

  const baseUrl =
    process.env.R3_APP_BASE_URL ?? "https://r3-pre-mvp-full.vercel.app";

  const pageUrl = `${baseUrl}/r/${refCode}`;
  const ogImageUrl = `${baseUrl}/api/ogimage?shareId=${refCode}&v=2`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

/* ---------------------------------------------
   2) MAIN PAGE LOGIC
--------------------------------------------- */

export default async function ShareRedirectPage({ params }: PageProps) {
  const refCode = extractRefCode(params.code);

  const supabase = supabaseServer();

  // 2-1. 해당 공유 링크 정보 읽기
  const { data, error } = await supabase
    .from("r3_shares")
    .select(
      "ref_code, title, target_url, original_url, views, hop, message_id"
    )
    .eq("ref_code", refCode)
    .maybeSingle<ShareRow>();

  if (error || !data) {
    return (
      <div
        style={{
          backgroundColor: "#020617",
          heigh
