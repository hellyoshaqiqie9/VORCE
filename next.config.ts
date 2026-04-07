import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "cdn.vorce.id",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      }
    ],
  },
};

export default nextConfig;
