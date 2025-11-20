// app/r/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/r/:path*"],
};

export function middleware(req: NextRequest) {
  const ua = req.headers.get("user-agent") || "";
  const isKakao = /Kakao|Kakaotalk|KakaoScrap/i.test(ua);
  const pv = req.nextUrl.searchParams.get("pv");

  // 🔹 URL에서 ref 코드 추출: /r/RCgm2oo -> "RCgm2oo"
  const pathname = req.nextUrl.pathname; // 예: "/r/RCgm2oo"
  const segments = pathname.split("/").filter(Boolean); // ["r","RCgm2oo",...]

  let ref: string | null = null;
  if (segments.length >= 2 && segments[0] === "r") {
    ref = segments[1];
  }

  const requestHeaders = new Headers(req.headers);

  // ref 코드를 우리 쪽으로 넘기기
  if (ref) {
    requestHeaders.set("x-r3-ref", ref);
  }

  // 카카오/프리뷰용 플래그도 그대로 유지
  if (isKakao || pv === "2") {
    requestHeaders.set("x-r3-preview", "1");
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}
