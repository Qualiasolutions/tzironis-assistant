'use client';

import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { X } from 'lucide-react';
import { useTranslation } from '../lib/LanguageContext';

interface PWAInstallPromptProps {
  className?: string;
}

export default function PWAInstallPrompt({ className }: PWAInstallPromptProps) {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    // Store the event for later use
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      // Store the event for later use
      setInstallPrompt(e);
      setIsVisible(true);
    };

    // Listen for the beforeinstallprompt event
    window.addEventListener('pwaInstallAvailable', handleBeforeInstallPrompt);

    // Check if the app is already installed
    const isAppInstalled = window.matchMedia('(display-mode: standalone)').matches;
    if (isAppInstalled) {
      setIsVisible(false);
    }

    return () => {
      window.removeEventListener('pwaInstallAvailable', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    // Show the install prompt
    try {
      // @ts-ignore - deferredPrompt is not a standard property
      const result = await window.deferredPrompt.prompt();
      console.log('Install prompt result:', result);
      
      // Reset the deferred prompt variable
      window.deferredPrompt = null;
      setInstallPrompt(null);
      setIsVisible(false);
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
  };

  const dismissPrompt = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-20 left-0 right-0 mx-auto w-[90%] max-w-md bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 z-50 border border-slate-200 dark:border-slate-700 ${className}`}>
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-medium text-slate-900 dark:text-white">{t('installApp') || 'Install App'}</h3>
        <button 
          onClick={dismissPrompt}
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
        >
          <X size={20} />
        </button>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
        {t('installPromptMessage') || 'Install this app on your device for quick and easy access.'}
      </p>
      <div className="flex justify-end">
        <Button 
          onClick={handleInstallClick}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          {t('installNow') || 'Install Now'}
        </Button>
      </div>
    </div>
  );
}

// Add this to global.d.ts
declare global {
  interface Window {
    deferredPrompt: any;
  }
} 