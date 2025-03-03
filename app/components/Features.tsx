'use client';

import React from 'react';
import { Database, FileText, Users, Bot } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/app/lib/LanguageContext';

export default function Features() {
  const { t } = useLanguage();
  
  const features = [
    {
      id: 'knowledge-base',
      title: t('navKnowledgeBase') || 'Knowledge Base',
      description: t('knowledgeBaseDesc') || 'Search and manage your business knowledge base',
      icon: <Database className="h-6 w-6 text-primary" />,
      href: '/knowledge-base',
    },
    {
      id: 'invoice-automation',
      title: t('navInvoiceAutomation') || 'Invoice Automation',
      description: t('invoiceAutomationDesc') || 'Automate your invoice processing workflow',
      icon: <FileText className="h-6 w-6 text-primary" />,
      href: '/invoice-automation',
    },
    {
      id: 'lead-generation',
      title: t('navLeadGeneration') || 'Lead Generation',
      description: t('leadGenerationDesc') || 'Generate and manage business leads',
      icon: <Users className="h-6 w-6 text-primary" />,
      href: '/lead-generation',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Tzironis Business Suite
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          {t('welcomeMessage') || 'Access powerful business tools powered by AI to streamline your operations.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {features.map((feature) => (
          <Link href={feature.href} key={feature.id}>
            <div className="feature-card group hover-card-effect">
              <div className="mb-4 flex justify-center">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  {feature.icon}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-center mb-3 text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-center">
                {feature.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
      
      <div className="mt-16 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center">
          <Bot className="h-4 w-4 mr-2 text-primary" />
          Powered by QUALIA AI
        </p>
      </div>
    </div>
  );
} 