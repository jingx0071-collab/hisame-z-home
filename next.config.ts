import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.114'],
  async rewrites() {
    return [
      {
        source: '/.well-known/appspecific/com.tesla.3p.public-key.pem',
        destination: '/api/tesla-pubkey',
      },
    ];
  },
};

export default nextConfig;
