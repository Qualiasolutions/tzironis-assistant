"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "./lib/LanguageContext";
import NavBar from "./components/NavBar";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Features from './components/Features';
import ChatInterface from './components/ChatInterface';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'features' | 'chat'>('chat');
  
  useEffect(() => {
    // Redirect to login page if user is not authenticated
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // If loading, show a simple loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary text-xl">Loading...</div>
      </div>
    );
  }

  // If authenticated, show the chat interface as the main content
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <NavBar />
      <div className="pt-16 h-screen flex flex-col">
        <div className="container mx-auto px-4 flex-1 overflow-hidden flex flex-col">
          {/* Tab navigation */}
          <div className="flex justify-center mt-4 mb-6">
            <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'chat'
                    ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary'
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setActiveTab('features')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'features'
                    ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary'
                }`}
              >
                Features
              </button>
            </div>
          </div>
          
          {/* Content based on active tab */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'chat' ? (
              <div className="h-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                <ChatInterface />
              </div>
            ) : (
              <Features />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
