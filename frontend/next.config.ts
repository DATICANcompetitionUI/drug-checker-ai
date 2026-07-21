import type { NextConfig } from "next";

const productionApiUrl = "https://drugchecker-ai-backend.onrender.com/api/v1";
const localApiUrl = "http://localhost:5000/api/v1";
const rawApiUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.VERCEL ? productionApiUrl : localApiUrl);

// Keep frontend calls same-origin and let Next/Vercel proxy them to the backend.
const apiBase = (rawApiUrl.startsWith("http") ? rawApiUrl : `https://${rawApiUrl}`).replace(/\/$/, "");

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
