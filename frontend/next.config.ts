import type { NextConfig } from "next";

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
// Ensure the URL always carries a protocol so Next.js rewrites don't reject it
const apiBase = rawApiUrl.startsWith("http") ? rawApiUrl : `http://${rawApiUrl}`;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async rewrites() {
    return [
      { source: "/users/:path*",        destination: `${apiBase}/users/:path*` },
      { source: "/drugs/:path*",        destination: `${apiBase}/drugs/:path*` },
      { source: "/interactions/:path*", destination: `${apiBase}/interactions/:path*` },
      { source: "/history/:path*",      destination: `${apiBase}/history/:path*` },
      { source: "/reports/:path*",      destination: `${apiBase}/reports/:path*` },
      { source: "/admin/:path*",        destination: `${apiBase}/admin/:path*` },
    ];
  },
};

export default nextConfig;
