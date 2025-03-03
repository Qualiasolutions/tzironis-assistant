'use client';

import React from 'react';
import NavBar from '../components/NavBar';
import dynamic from 'next/dynamic';

// Dynamically import PWAInstallPrompt with no SSR to avoid hydration errors
const PWAInstallPrompt = dynamic(
  () => import('../components/PWAInstallPrompt'),
  { ssr: false }
);

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-grow container mx-auto py-6">
        {children}
      </main>
      <PWAInstallPrompt />
    </div>
  );
} 