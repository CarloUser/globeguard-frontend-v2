import {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
const allowLocalVendureImages = process.env.NODE_ENV !== 'production';

// Hostname (no protocol/path) that serves Vendure assets, e.g. "api.globeguard.ch".
const assetHost = (process.env.NEXT_PUBLIC_ASSET_HOST || '').trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');

const remotePatterns: NonNullable<NextConfig['images']>['remotePatterns'] = [
    {
        protocol: 'http',
        hostname: 'localhost',
    },
    {
        protocol: 'http',
        hostname: '127.0.0.1',
    },
];

if (assetHost && assetHost !== 'localhost' && assetHost !== '127.0.0.1') {
    remotePatterns.push({
        protocol: 'https',
        hostname: assetHost,
    });
}

const nextConfig: NextConfig = {
    output: 'standalone',
    turbopack: {
        root: process.cwd(),
    },
    images: {
        dangerouslyAllowLocalIP: allowLocalVendureImages,
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 86400,
        remotePatterns,
    },
};

export default withNextIntl(nextConfig);
