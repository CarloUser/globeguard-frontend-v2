import type {Metadata, Viewport} from "next";
import {Suspense} from "react";
import {hasLocale, NextIntlClientProvider} from "next-intl";
import {Geist, Geist_Mono} from "next/font/google";
import {getMessages, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";
import {routing} from "@/i18n/routing";
import {toOgLocale} from "@/i18n/locale-utils";
import {getRouteLocale} from "@/i18n/server";
import {Toaster} from "@/components/ui/sonner";
import {Navbar} from "@/components/layout/navbar";
import {Footer} from "@/components/layout/footer";
import {ThemeProvider} from "@/components/providers/theme-provider";
import {SITE_NAME, SITE_URL} from "@/lib/metadata";
import {getGlobeguardContent} from "@/content/globeguard";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export function generateStaticParams() {
    return routing.locales.map((locale) => ({locale}));
}

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const ogLocale = toOgLocale(locale);
    const content = getGlobeguardContent(locale);
    return {
        metadataBase: new URL(SITE_URL),
        title: {
            default: SITE_NAME,
            template: `%s | ${SITE_NAME}`,
        },
        description: content.homeMeta.description,
        openGraph: {
            type: "website",
            siteName: SITE_NAME,
            locale: ogLocale,
        },
        twitter: {
            card: "summary_large_image",
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                "max-video-preview": -1,
                "max-image-preview": "large",
                "max-snippet": -1,
            },
        },
        alternates: {
            languages: Object.fromEntries(
                routing.locales.map((l) => [l, `/${l}`])
            ),
        },
    };
}

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    themeColor: [
        {media: "(prefers-color-scheme: light)", color: "#f8fafc"},
        {media: "(prefers-color-scheme: dark)", color: "#0b1220"},
    ],
};

export default async function LocaleLayout({children, params}: {children: React.ReactNode; params: Promise<{locale: string}>}) {
    const {locale} = await params;

    if (!hasLocale(routing.locales, locale)) {
        notFound();
    }

    setRequestLocale(locale);
    const messages = await getMessages({locale});

    return (
        <html lang={locale} data-scroll-behavior="smooth" suppressHydrationWarning>
            <body
                suppressHydrationWarning
                className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
            >
                <NextIntlClientProvider locale={locale} messages={messages}>
                    <Suspense>
                        <ThemeProvider>
                            <Navbar />
                            {children}
                            <Footer locale={locale}/>
                            <Toaster/>
                        </ThemeProvider>
                    </Suspense>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}


