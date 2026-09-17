'use client';

import {useEffect} from 'react';

const textStyle = {color: '#475569', maxWidth: '32rem', margin: '0.75rem auto 0', lineHeight: 1.6};

/**
 * Root error boundary. It replaces the root layout, so next-intl messages and the
 * design tokens are not available here; the copy is inline (German, then English).
 */
export default function GlobalError({error, reset}: {error: Error & {digest?: string}; reset: () => void}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <html lang="de">
            <body style={{fontFamily: 'system-ui, sans-serif', margin: 0, padding: '4rem 1rem', textAlign: 'center', color: '#0f172a'}}>
                <h1 style={{fontSize: '1.5rem', fontWeight: 700, margin: 0}}>Etwas ist schiefgelaufen</h1>
                <p style={textStyle}>Die Seite konnte nicht geladen werden. Bitte versuchen Sie es erneut.</p>
                <p lang="en" style={textStyle}>Something went wrong. The page could not be loaded, please try again.</p>
                <button
                    type="button"
                    onClick={() => reset()}
                    style={{
                        marginTop: '2rem',
                        padding: '0.625rem 1.25rem',
                        borderRadius: '0.375rem',
                        border: '1px solid #0f172a',
                        background: '#0f172a',
                        color: '#ffffff',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                    }}
                >
                    Erneut versuchen / Try again
                </button>
            </body>
        </html>
    );
}
