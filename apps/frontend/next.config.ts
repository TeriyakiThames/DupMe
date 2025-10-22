import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    "https://192.168.1.104:3000",
    "https://localhost:3000",
  ],
};

export default nextConfig;
