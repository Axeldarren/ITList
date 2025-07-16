import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '8000', // Make sure this matches your backend server port
                pathname: '/uploads/**',
            },
        ],
    },
};

export default nextConfig;
