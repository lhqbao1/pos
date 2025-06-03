import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["geist"],
  images: {
    domains: ['www.google.com',"encrypted-tbn0.gstatic.com",'localhost'],
  },
  /* config options here */
};

export default nextConfig;
