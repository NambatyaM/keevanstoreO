import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "standalone" — NOT needed on Vercel (only for Docker/self-hosted)
  reactStrictMode: true,
  allowedDevOrigins: ['127.0.0.1'],
};

export default nextConfig;
