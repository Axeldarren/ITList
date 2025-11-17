import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '8008', 
                pathname: '/uploads/**'
            },
            {
                protocol: 'https',
                hostname: 'itlist-server-production.up.railway.app',
                pathname: '/uploads/**'
            },
        ],
    },
};

export default nextConfig;
