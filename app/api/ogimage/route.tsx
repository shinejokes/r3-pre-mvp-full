// app/api/ogimage/route.ts
import React from "react";
import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { supabaseServer } from "../../../lib/supabaseServer";

export const runtime = "edge";

// YouTube 링크에서 영상 ID 추출
function extractYouTubeId(urlStr: string): string | null {
  try {
    const url = new URL(urlStr);

    if (url.hostname.includes("youtu.be")) {
      // https://youtu.be/VIDEO_ID
      return url.pathname.replace("/", "").split("/")[0] || null;
    }

    if (url.hostname.includes("youtube.com")) {
      // https://www.youtube.com/watch?v=VIDEO_ID
      const v = url.searchParams.get("v");
      if (v) return v;

      // https://www.youtube.com/shorts/VIDEO_ID
      if (url.pathname.startsWith("/shorts/")) {
        return url.pathname.split("/")[2] || null;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

// YouTube 썸네일 URL 만들기
function getYouTubeThumbnail(urlStr: string): string | null {
  const id = extractYouTubeId(urlStr);
  if (!id) return null;
  // 너무 큰 maxres 대신 비교적 안전한 hqdefault 사용
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

// 외부 페이지의 og:image 추출 (다양한 사이트 대응)
async function fetchOgImage(urlStr: string): Promise<string | null> {
  try {
    const res = await fetch(urlStr, {
      method: "GET",
      headers: {
        // 봇 차단을 피하기 위한 일반 브라우저 UA
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      },
    });

    if (!res.ok) return null;
    const html = await res.text();

    // og:image
    const ogMatch = html.match(
      /<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i
    );
    if (ogMatch?.[1]) return ogMatch[1];

    // twitter:image
    const twMatch = html.match(
      /<meta[^>]+name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/i
    );
    if (twMatch?.[1]) return twMatch[1];

    return null;
  } catch {
    return null;
  }
}

// target/original_url에서 최종 썸네일 URL 결정
async function resolveThumbnailUrl(targetUrl: string): Promise<string | null> {
  if (!targetUrl) return null;

  // 1) YouTube면 자체 규칙으로 바로 썸네일 생성
  const youtub
