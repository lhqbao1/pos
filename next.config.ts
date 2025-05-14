import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["geist"],
  images: {
    domains: ['www.google.com'],
  },
  /* config options here */
};

export default nextConfig;
