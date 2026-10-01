import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lint runs separately with `pnpm lint`; the build-time lint step cannot resolve plugins under pnpm.
  eslint: { ignoreDuringBuilds: true },
  images: {
    // Admin-uploaded product photos live in Vercel Blob.
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
};

export default nextConfig;
