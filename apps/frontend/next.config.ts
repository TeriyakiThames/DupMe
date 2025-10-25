import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    root: '/Users/pop/Desktop/Dev/DupMe/apps/frontend/',
  },

  assetPrefix: process.env.NODE_ENV === 'production' ? 'https://dupme.poppoo.xyz' : '',
  // assetPrefix:'https://dupme.poppoo.xyz' ,
  output: 'standalone', // optional but helps with builds
};

export default nextConfig;
