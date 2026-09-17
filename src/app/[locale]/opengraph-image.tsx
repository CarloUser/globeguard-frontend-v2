import {ImageResponse} from 'next/og';
import {SITE_NAME} from '@/lib/metadata';

export const alt = SITE_NAME;
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: 72,
                    color: '#ffffff',
                    background: 'linear-gradient(135deg, #0f172a 0%, #115e59 58%, #f59e0b 100%)',
                    fontFamily: 'Arial, sans-serif',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        fontSize: 28,
                        letterSpacing: 4,
                        textTransform: 'uppercase',
                        opacity: 0.86,
                    }}
                >
                    Vendure Commerce
                </div>
                <div
                    style={{
                        display: 'flex',
                        marginTop: 28,
                        maxWidth: 880,
                        fontSize: 88,
                        fontWeight: 700,
                        lineHeight: 1.02,
                    }}
                >
                    {SITE_NAME}
                </div>
                <div
                    style={{
                        display: 'flex',
                        marginTop: 30,
                        maxWidth: 760,
                        fontSize: 34,
                        lineHeight: 1.3,
                        opacity: 0.92,
                    }}
                >
                    Modern storefront powered by Vendure and Next.js
                </div>
            </div>
        ),
        size
    );
}