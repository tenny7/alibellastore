import type { Metadata } from "next";
import { Space_Grotesk, DM_Sans, JetBrains_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast-provider";
import { getSiteSettings } from "@/lib/settings";
import { darkenHex } from "@/lib/utils";
import "./globals.css";

// Self-hosted at build time by next/font. The design ships these as Google
// Fonts <link> tags, but our CSP is font-src 'self' / style-src 'self', which
// would block fonts.googleapis.com — next/font serves them same-origin.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

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
  const settings = await getSiteSettings();
  const primaryColor = settings.primary_color || "#1A73E8";
  const hoverColor = darkenHex(primaryColor, 15);

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <style
          dangerouslySetInnerHTML={{
            __html: `:root{--brand-primary:${primaryColor};--brand-primary-hover:${hoverColor}}`,
          }}
        />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${dmSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
