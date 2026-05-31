import type { NextConfig } from "next";

const createRemotePattern = (rawUrl?: string | null) => {
  if (!rawUrl) return null;

  try {
    const parsed = new URL(rawUrl);
    return {
      protocol: parsed.protocol.replace(":", "") as "http" | "https",
      hostname: parsed.hostname,
      port: parsed.port || undefined,
    };
  } catch {
    return null;
  }
};

const apiRemotePattern = createRemotePattern(
  process.env.NEXT_PUBLIC_NEST_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL,
);

const mediaRemotePattern = createRemotePattern(process.env.NEXT_PUBLIC_MEDIA_BASE_URL);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["geist"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.google.com",
      },
      {
        protocol: "https",
        hostname: "encrypted-tbn0.gstatic.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "localhost",
      },
      ...(apiRemotePattern ? [apiRemotePattern] : []),
      ...(mediaRemotePattern ? [mediaRemotePattern] : []),
    ],
  },
  /* config options here */
};

export default nextConfig;
