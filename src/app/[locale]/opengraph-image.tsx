import {ImageResponse} from 'next/og';
import {SITE_NAME} from '@/lib/metadata';

export const alt = SITE_NAME;
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = 'image/png';

// Brand-only Open Graph image: wordmark + tagline, no product claims.
// Relies on the default font bundled with next/og so it never depends on a network font fetch.
const TAGLINE = 'Lösungen für Reisemobile, Fernreisende und Werkstätten';

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
                    padding: 80,
                    color: '#ffffff',
                    background: 'linear-gradient(135deg, #0E1E4B 0%, #0083C2 100%)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        fontSize: 112,
                        fontWeight: 700,
                        letterSpacing: -2,
                        lineHeight: 1,
                    }}
                >
                    {SITE_NAME}
                </div>
                <div
                    style={{
                        display: 'flex',
                        marginTop: 36,
                        maxWidth: 900,
                        fontSize: 40,
                        lineHeight: 1.3,
                        opacity: 0.92,
                    }}
                >
                    {TAGLINE}
                </div>
                <div
                    style={{
                        display: 'flex',
                        marginTop: 48,
                        fontSize: 26,
                        letterSpacing: 3,
                        textTransform: 'uppercase',
                        opacity: 0.75,
                    }}
                >
                    globeguard.ch
                </div>
            </div>
        ),
        size
    );
}
