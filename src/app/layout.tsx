import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Newsreader, JetBrains_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast-provider";
import { ThemeScript } from "@/components/storefront/theme-toggle";
import { getSiteSettings } from "@/lib/settings";
import "./globals.css";

// Self-hosted at build time by next/font. The design ships these as Google
// Fonts <link> tags, but our CSP is font-src 'self' / style-src 'self', which
// would block fonts.googleapis.com — next/font serves them same-origin.
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  display: "swap",
});

// The design's body face. Italic is used for the pull-quotes and accents,
// so both styles are loaded.
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal", "italic"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

// Single viewport declaration. There were two <meta name="viewport"> tags —
// one hand-written here, one from Next — which browsers resolve
// unpredictably and which caused the double-tap zoom/jump.
//
// maximumScale is deliberately NOT set: capping it blocks pinch-zoom, which
// fails WCAG 1.4.4. Double-tap zoom is suppressed with touch-action instead,
// which leaves pinch-zoom working.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#171614" },
    { media: "(prefers-color-scheme: light)", color: "#F4F1E8" },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    title: {
      default: settings.store_name,
      template: `%s | ${settings.store_name}`,
    },
    description: settings.store_description,
    metadataBase: new URL(appUrl),
    openGraph: {
      type: "website",
      siteName: settings.store_name,
      title: settings.store_name,
      description: settings.store_description,
      url: appUrl,
    },
    twitter: {
      card: "summary_large_image",
      title: settings.store_name,
      description: settings.store_description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${bricolage.variable} ${newsreader.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
