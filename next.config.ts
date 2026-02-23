import type { NextConfig } from "next";

const nextConfig: NextConfig = {

};

export default nextConfig;

module.exports = {
  async rewrites() {
    return [
    {
      source: '/api/backend/:path*',
      destination: 'http://44.220.143.197:8080/:path*',
    },
  ]
  },
}