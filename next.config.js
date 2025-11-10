// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,     // 기존 설정이 있으면 그대로 유지
  swcMinify: true,           // 성능 개선용, 이미 있다면 중복 제거 가능

  webpack: (config) => {
    // 🔹 WebAssembly (Resvg WASM용) 활성화
    config.experiments = {
      ...(config.experiments || {}),
      asyncWebAssembly: true,
      topLevelAwait: true,   // 일부 WASM 패키지에서 필요할 수 있음
    };

    return config;
  },

  // (선택) Next.js 빌드 관련 기타 옵션 — 기존에 있었다면 그대로 두세요.
  // images: { unoptimized: true },
  // output: 'standalone',
};

module.exports = nextConfig;


