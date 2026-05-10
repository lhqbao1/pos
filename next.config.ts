import type { NextConfig } from "next";

const strapiRemotePattern = (() => {
  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL;

  if (!strapiUrl) return null;

  try {
    const parsed = new URL(strapiUrl);
    return {
      protocol: parsed.protocol.replace(":", "") as "http" | "https",
      hostname: parsed.hostname,
      port: parsed.port || undefined,
    };
  } catch {
    return null;
  }
})();

const strapiMediaRemotePattern = (() => {
  if (!strapiRemotePattern) return null;

  const suffix = ".strapiapp.com";
  if (!strapiRemotePattern.hostname.endsWith(suffix)) return null;

  const subdomain = strapiRemotePattern.hostname.slice(0, -suffix.length);
  if (!subdomain) return null;

  return {
    protocol: "https" as const,
    hostname: `${subdomain}.media.strapiapp.com`,
  };
})();

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
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "localhost",
      },
      ...(strapiRemotePattern ? [strapiRemotePattern] : []),
      ...(strapiMediaRemotePattern ? [strapiMediaRemotePattern] : []),
    ],
  },
  /* config options here */
};

export default nextConfig;
