import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: ".",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "pub-57b2de7eedaa4c00aa47337364c8cebd.r2.dev",
      },
    ],
  },
};

export default nextConfig;