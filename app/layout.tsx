import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "./lib/LanguageContext";
import { AuthProvider } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-geist" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "Qualia AI | Intelligent Business Assistant for Tzironis",
  description: "AI-powered assistant for Tzironis offering website knowledge base, invoice automation, and business lead generation.",
  keywords: ["AI assistant", "Tzironis", "business automation", "invoice automation", "knowledge base", "lead generation"],
  authors: [{ name: "Tzironis Team" }],
  creator: "Tzironis",
  publisher: "Tzironis",
  metadataBase: new URL("https://tzironis.gr"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} ${jetbrainsMono.variable} bg-white text-gray-900 min-h-screen`}>
        <AuthProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
