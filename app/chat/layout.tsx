import React from 'react';
import NavBar from '../components/NavBar';

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
    </div>
  );
} 