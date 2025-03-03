import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "./lib/LanguageContext";
import { AuthProvider } from "./providers";
import Script from "next/script";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"], 
  variable: "--font-jetbrains-mono",
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Qualia AI | Intelligent Business Assistant for Tzironis",
  description: "AI-powered assistant for Tzironis offering website knowledge base, invoice automation, and business lead generation.",
  keywords: ["AI assistant", "Tzironis", "business automation", "invoice automation", "knowledge base", "lead generation"],
  authors: [{ name: "Tzironis Team" }],
  creator: "Tzironis",
  publisher: "Tzironis",
  metadataBase: new URL("https://tzironis.gr"),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tzironis Assistant",
  },
  applicationName: "Tzironis Assistant",
  formatDetection: {
    telephone: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="smooth-scroll" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="theme-color" content="#000F2E" />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased font-sans`}>
        <AuthProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </AuthProvider>
        <Script src="/pwa.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
