"use client";

import Link from "next/link";
import { Brain, FileText, Users } from "lucide-react";
import NavBar from "./components/NavBar";
import { useLanguage } from "./lib/LanguageContext";

export default function Home() {
  const { t } = useLanguage();
  
  return (
    <main className="flex min-h-screen flex-col bg-white">
      <NavBar />
      
      <div className="container flex-1 items-center justify-center py-12 px-4 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <div className="mb-4 mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center hover-card-effect">
              <Brain className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl">
              {t("homeTitle")}
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              {t("homeSubtitle")}
            </p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard 
              icon={<Brain className="h-10 w-10" />}
              title={t("featureWebsiteKnowledge")}
              description={t("featureWebsiteDesc")}
              href="/knowledge-base"
            />
            <FeatureCard 
              icon={<FileText className="h-10 w-10" />}
              title={t("featureInvoice")}
              description={t("featureInvoiceDesc")}
              href="/invoice-automation"
            />
            <FeatureCard 
              icon={<Users className="h-10 w-10" />}
              title={t("featureLeads")}
              description={t("featureLeadsDesc")}
              href="/lead-generation"
            />
          </div>
          
          <div className="mt-16 flex justify-center">
            <Link
              href="/chat"
              className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-white shadow-md transition-colors hover:bg-accent hover-card-effect"
            >
              {t("startChatting")}
            </Link>
          </div>
        </div>
      </div>
      
      <footer className="border-t bg-white py-6">
        <div className="container px-4 sm:px-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-center text-sm text-gray-500 md:text-left">
              &copy; {new Date().getFullYear()} Tzironis. {t("footerRights")}
            </p>
            <div className="flex items-center space-x-4">
              <Link 
                href="https://tzironis.gr/privacy" 
                className="text-sm text-gray-500 hover:text-primary transition-colors"
              >
                {t("footerPrivacy")}
              </Link>
              <Link 
                href="https://tzironis.gr/terms" 
                className="text-sm text-gray-500 hover:text-primary transition-colors"
              >
                {t("footerTerms")}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}

function FeatureCard({ icon, title, description, href }: FeatureCardProps) {
  return (
    <Link 
      href={href}
      className="feature-card group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:translate-y-[-2px]"
    >
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 rounded-full bg-primary/10 p-3 text-primary">
          {icon}
        </div>
        <h3 className="mb-2 text-xl font-medium text-gray-900">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </Link>
  );
}
