import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["next-auth"],
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg", "prisma"],
};

export default nextConfig;
