import {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
const allowLocalVendureImages = process.env.NODE_ENV !== 'production';

const nextConfig: NextConfig = {
    output: 'standalone',
    turbopack: {
        root: process.cwd(),
    },
    images: {
        dangerouslyAllowLocalIP: allowLocalVendureImages,
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 86400,
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'localhost',
            },
            {
                protocol: 'http',
                hostname: '127.0.0.1',
            },
        ],
    },
};

export default withNextIntl(nextConfig);