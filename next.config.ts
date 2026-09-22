import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Phone camera photos routinely run several MB; raise the default 1MB cap.
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
