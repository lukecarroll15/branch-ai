import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // These CommonJS libs read files / use Node APIs at runtime and break when
  // bundled. Keep them external so they're loaded natively on the server.
  serverExternalPackages: ["pdf-parse", "mammoth"],
};

export default nextConfig;
