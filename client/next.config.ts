import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
        remotePatterns: [
            {
                protocol: (process.env.NEXT_PUBLIC_API_PROTOCOL || 'http') as 'http' | 'https',
                hostname: process.env.NEXT_PUBLIC_API_HOSTNAME || 'localhost',
                port: process.env.NEXT_PUBLIC_API_PORT || '8008', 
                pathname: '/uploads/**'
            },
        ],
    },
};

export default nextConfig;
