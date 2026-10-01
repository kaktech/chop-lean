import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Admin-uploaded product photos live in Vercel Blob.
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
};

export default nextConfig;
