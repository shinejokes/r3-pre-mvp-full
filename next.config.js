/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.ytimg.com' }, // YouTube 썸네일
    ],
  },
};
module.exports = nextConfig;

