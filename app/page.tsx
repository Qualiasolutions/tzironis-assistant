"use client";

import Link from "next/link";
import { Brain, FileText, Users, MessageCircle, ChevronRight } from "lucide-react";
import NavBar from "./components/NavBar";
import { useLanguage } from "./lib/LanguageContext";
import { useEffect, useState } from "react";

export default function Home() {
  const { t } = useLanguage();
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    setIsLoaded(true);
  }, []);
  
  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-white to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <NavBar />
      
      <div className="container flex-1 items-center justify-center py-16 px-4 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className={`mb-16 text-center ${isLoaded ? 'animate-fadein' : 'opacity-0'}`} style={{ animationDelay: "0.1s" }}>
            <div className="mb-6 mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center hover-card-effect">
              <Brain className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-5xl font-bold tracking-tight gradient-text sm:text-6xl mb-4">
              {t("homeTitle")}
            </h1>
            <p className="mt-6 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {t("homeSubtitle")}
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                href="/chat"
                className="inline-flex h-14 items-center justify-center rounded-full bg-primary px-8 text-base font-medium text-white shadow-lg transition-all hover:bg-accent hover:shadow-xl hover-card-effect"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                {t("startChatting")}
                <ChevronRight className="ml-1 h-5 w-5" />
              </Link>
            </div>
          </div>
          
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard 
              icon={<Brain className="h-10 w-10" />}
              title={t("featureWebsiteKnowledge")}
              description={t("featureWebsiteDesc")}
              href="/knowledge-base"
              delay={0.2}
              isLoaded={isLoaded}
            />
            <FeatureCard 
              icon={<FileText className="h-10 w-10" />}
              title={t("featureInvoice")}
              description={t("featureInvoiceDesc")}
              href="/invoice-automation"
              delay={0.3}
              isLoaded={isLoaded}
            />
            <FeatureCard 
              icon={<Users className="h-10 w-10" />}
              title={t("featureLeads")}
              description={t("featureLeadsDesc")}
              href="/lead-generation"
              delay={0.4}
              isLoaded={isLoaded}
            />
          </div>
          
          <div className={`mt-20 text-center ${isLoaded ? 'animate-fadein' : 'opacity-0'}`} style={{ animationDelay: "0.5s" }}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              {t("poweredBy")}
              <span className="gradient-text ml-2">Mistral AI</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t("aiDescription")}
            </p>
          </div>
        </div>
      </div>
      
      <footer className="border-t backdrop-blur-md bg-white/50 dark:bg-gray-800/30 py-8">
        <div className="container px-4 sm:px-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 md:text-left">
              &copy; {new Date().getFullYear()} Tzironis. {t("footerRights")}
            </p>
            <div className="flex items-center space-x-6">
              <Link 
                href="https://tzironis.gr/privacy" 
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
              >
                {t("footerPrivacy")}
              </Link>
              <Link 
                href="https://tzironis.gr/terms" 
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
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
  delay: number;
  isLoaded: boolean;
}

function FeatureCard({ icon, title, description, href, delay, isLoaded }: FeatureCardProps) {
  return (
    <Link 
      href={href}
      className={`feature-card group relative overflow-hidden rounded-xl border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm p-8 shadow-md transition-all ${isLoaded ? 'animate-fadein' : 'opacity-0'}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex flex-col items-center text-center">
        <div className="mb-5 rounded-xl bg-primary/10 dark:bg-primary/20 p-4 text-primary">
          {icon}
        </div>
        <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300">{description}</p>
        <div className="mt-6 inline-flex items-center font-medium text-primary">
          {t("exploreFeature")} <ChevronRight className="ml-1 h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}
