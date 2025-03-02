"use client";

import { useLanguage } from "@/app/lib/LanguageContext";
import { useState } from "react";

export default function LanguageSwitcher() {
  const { language, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);
  const closeDropdown = () => setIsOpen(false);

  const handleLanguageChange = (lang: "en" | "el") => {
    changeLanguage(lang);
    closeDropdown();
  };

  return (
    <div className="relative">
      <button
        className="flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {language === "en" ? "EN" : "ΕΛ"}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={closeDropdown}
            aria-hidden="true"
          ></div>
          <div className="absolute right-0 z-20 mt-1 w-24 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1" role="menu" aria-orientation="vertical">
              <button
                className={`block w-full px-4 py-2 text-left text-sm ${
                  language === "en"
                    ? "bg-gray-100 text-primary"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => handleLanguageChange("en")}
                role="menuitem"
              >
                English
              </button>
              <button
                className={`block w-full px-4 py-2 text-left text-sm ${
                  language === "el"
                    ? "bg-gray-100 text-primary"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => handleLanguageChange("el")}
                role="menuitem"
              >
                Ελληνικά
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 