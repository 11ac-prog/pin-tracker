import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Vercel's Functions hard-cap request bodies at 4.5mb regardless of this
      // setting, so this just raises Next's own (lower) default to meet that
      // ceiling rather than promising more than the deployed app can accept.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
