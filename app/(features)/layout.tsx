'use client';

import React from 'react';
import NavBar from '../components/NavBar';
import dynamic from 'next/dynamic';

// Dynamically import PWAInstallPrompt with no SSR to avoid hydration errors
const PWAInstallPrompt = dynamic(
  () => import('../components/PWAInstallPrompt'),
  { ssr: false }
);

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-grow">{children}</main>
      <footer className="border-t bg-white/90 backdrop-blur-sm py-6">
        <div className="container px-4 sm:px-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-center text-sm text-muted-foreground md:text-left">
              &copy; {new Date().getFullYear()} Tzironis. All rights reserved.
            </p>
            <div className="flex items-center space-x-4">
              <a 
                href="https://tzironis.gr/privacy" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Privacy Policy
              </a>
              <a 
                href="https://tzironis.gr/terms" 
                target="_blank"
                rel="noopener noreferrer" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
      {/* PWA Install Prompt will render when installation is available */}
      <PWAInstallPrompt />
    </div>
  );
} 