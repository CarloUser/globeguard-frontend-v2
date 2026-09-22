import type {Metadata, Viewport} from "next";
import {hasLocale, NextIntlClientProvider} from "next-intl";
import {Inter, JetBrains_Mono} from "next/font/google";
import {getMessages, getTranslations, setRequestLocale} from "next-intl/server";
import {cookies} from "next/headers";
import {notFound} from "next/navigation";
import {routing} from "@/i18n/routing";
import {toOgLocale} from "@/i18n/locale-utils";
import {getRouteLocale} from "@/i18n/server";
import {Toaster} from "@/components/ui/sonner";
import {Navbar} from "@/components/layout/navbar";
import {Footer} from "@/components/layout/footer";
import {DisplayCurrencyProvider} from "@/components/providers/display-currency-provider";
import {DISPLAY_CURRENCY_COOKIE, isDisplayCurrency} from "@/lib/display-currency";
import {SITE_NAME, SITE_URL} from "@/lib/metadata";
import "./globals.css";

// Light-only design, Inter as the single sans-serif face (DECISIONS.md A9).
const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin", "latin-ext"],
    weight: ["400", "500", "600", "700"],
    display: "swap",
});

// Mono face for SKU / order-code / transaction-id labels (`font-mono` utility).
const jetbrainsMono = JetBrains_Mono({
    variable: "--font-jetbrains-mono",
    subsets: ["latin"],
    weight: ["400", "500", "700"],
    display: "swap",
});

export function generateStaticParams() {
    return routing.locales.map((locale) => ({locale}));
}

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const ogLocale = toOgLocale(locale);
    const t = await getTranslations({locale, namespace: "Common"});

    // Canonical + hreflang are page-specific: every page sets them via buildAlternates()
    // (src/lib/metadata.ts). A layout-level alternates.languages would advertise the
    // homepage as the alternate of every page and be replaced by any page-level canonical.
    return {
        metadataBase: new URL(SITE_URL),
        title: {
            default: SITE_NAME,
            template: `%s | ${SITE_NAME}`,
        },
        description: t("siteDescription"),
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
    };
}

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    // Light background token (--background: 0 0% 100%).
    themeColor: "#ffffff",
    colorScheme: "light",
};

export default async function LocaleLayout({children, params}: {children: React.ReactNode; params: Promise<{locale: string}>}) {
    const {locale} = await params;

    if (!hasLocale(routing.locales, locale)) {
        notFound();
    }

    setRequestLocale(locale);
    const messages = await getMessages({locale});

    // Display currency (CHF | EUR, display-only) from the visitor's cookie so the first paint
    // already matches the chosen currency instead of switching after hydration. The layout is
    // dynamic anyway (the navbar reads the auth cookie), so this costs no static rendering.
    const displayCurrencyCookie = (await cookies()).get(DISPLAY_CURRENCY_COOKIE)?.value;
    const initialCurrency = isDisplayCurrency(displayCurrencyCookie) ? displayCurrencyCookie : undefined;

    const tNav = await getTranslations({locale, namespace: "Navigation"});

    return (
        <html lang={locale} data-scroll-behavior="smooth">
            <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased flex flex-col min-h-screen`}>
                {/* No Suspense boundary around the page: a boundary here would let Next flush the
                    shell with HTTP 200 before a page's notFound() runs, so 404s would only be
                    "soft" (client-side). The navbar keeps its own boundaries for the async slots. */}
                {/* First focusable element on every page: a keyboard or screen-reader visitor can
                    jump past the navbar instead of tabbing through it on every navigation. It is
                    off-screen until focused (focus:not-sr-only). Every page gives its own main
                    landmark the id this points at. */}
                <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
                >
                    {tNav("skipToContent")}
                </a>
                <NextIntlClientProvider locale={locale} messages={messages}>
                    <DisplayCurrencyProvider initialCurrency={initialCurrency}>
                        <Navbar />
                        {children}
                        <Footer locale={locale}/>
                        <Toaster/>
                    </DisplayCurrencyProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
