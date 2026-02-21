import type { NextConfig } from "next";

const nextConfig: NextConfig = {

};

export default nextConfig;

module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: 'http://98.94.22.123:8080/:path*',
      },
    ]
  },
}