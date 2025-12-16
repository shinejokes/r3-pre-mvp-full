import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "r3_did";

export const config = {
  matcher: ["/r/:path*"], // ✅ 기존 그대로 유지
};

export function middleware(req: NextRequest) {
  const ua = req.headers.get("user-agent") || "";
  const isKakao = /Kakao|Kakaotalk|KakaoScrap/i.test(ua);
  const pv = req.nextUrl.searchParams.get("pv");

  // URL에서 ref 코드 추출: /r/RCgm2oo -> "RCgm2oo"
  const pathname = req.nextUrl.pathname;
  const segments = pathname.split("/").filter(Boolean);

  let ref: string | null = null;
  if (segments.length >= 2 && segments[0] === "r") {
    ref = segments[1];
  }

  const requestHeaders = new Headers(req.headers);

  // ref 코드를 헤더로 전달
  if (ref) {
    requestHeaders.set("x-r3-ref", ref);
  }

  // 카카오/프리뷰 플래그 유지
  if (isKakao || pv === "2") {
    requestHeaders.set("x-r3-preview", "1");
  }

  // ✅ 여기서 NextResponse.next()를 만들고
  const res = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // ✅ device_id 쿠키 발급 (없을 때만)
  const existing = req.cookies.get(COOKIE_NAME)?.value;
  if (!existing) {
    const did =
      globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

    res.cookies.set(COOKIE_NAME, did, {
      httpOnly: false, // 프론트에서도 읽기 가능
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365 * 2, // 2년
    });
  }

  return res;
}
