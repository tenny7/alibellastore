import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast-provider";
import { getSiteSettings } from "@/lib/settings";
import { darkenHex } from "@/lib/utils";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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
        <style
          dangerouslySetInnerHTML={{
            __html: `:root{--brand-primary:${primaryColor};--brand-primary-hover:${hoverColor}}`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} font-sans antialiased`}>
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
