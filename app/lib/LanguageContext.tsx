"use client";

import { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { translations } from "./translations";

type Language = "en" | "el";
type Translations = typeof translations;

interface LanguageContextType {
  language: Language;
  t: (key: keyof Translations["en"]) => string;
  changeLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  const t = (key: keyof Translations["en"]): string => {
    const translationKey = key as keyof typeof translations[typeof language];
    return translations[language][translationKey] || key;
  };

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    // Store language preference in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("language", lang);
    }
  };

  const toggleLanguage = () => {
    const newLanguage = language === "en" ? "el" : "en";
    changeLanguage(newLanguage);
  };

  // Initialize language preference from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLanguage = localStorage.getItem("language") as Language;
      if (savedLanguage && (savedLanguage === "en" || savedLanguage === "el")) {
        setLanguage(savedLanguage);
      }
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ language, t, changeLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
} 