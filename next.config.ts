import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    dirs: ["."], // Lint all files in the project root and subdirectories
  },
};

export default nextConfig;
