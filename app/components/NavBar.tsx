"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { 
  Brain, 
  Menu, 
  X, 
  MessageSquare, 
  Database, 
  FileText, 
  Users, 
  LogOut, 
  LogIn, 
  User as UserIcon,
  Moon,
  Sun,
} from "lucide-react";
import { useLanguage } from "@/app/lib/LanguageContext";

export default function NavBar() {
  const { t, toggleLanguage, language } = useLanguage();
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check if dark mode is enabled in system or previously set
    const isDark = localStorage.getItem("darkMode") === "true" || 
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    setIsDarkMode(isDark);
    
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    localStorage.setItem("darkMode", String(newDarkMode));
    
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleSignIn = () => {
    signIn();
    setIsMenuOpen(false);
  };

  const handleSignOut = () => {
    signOut();
    setIsProfileOpen(false);
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    setIsProfileOpen(false);
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
    setIsMenuOpen(false);
  };

  const closeMenus = () => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  };

  return (
    <nav
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled 
          ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm" 
          : "bg-white dark:bg-gray-900"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity"
              onClick={closeMenus}
            >
              <Brain className="h-8 w-8" />
              <span className="text-xl font-bold hidden sm:block">QUALIA</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <NavLink href="/chat" active={pathname === "/chat"} onClick={closeMenus}>
              <MessageSquare className="h-4 w-4 mr-1.5" />
              {t("navChat")}
            </NavLink>
            <NavLink href="/knowledge-base" active={pathname === "/knowledge-base"} onClick={closeMenus}>
              <Database className="h-4 w-4 mr-1.5" />
              {t("navKnowledgeBase")}
            </NavLink>
            <NavLink href="/invoice-automation" active={pathname === "/invoice-automation"} onClick={closeMenus}>
              <FileText className="h-4 w-4 mr-1.5" />
              {t("navInvoiceAutomation")}
            </NavLink>
            <NavLink href="/lead-generation" active={pathname === "/lead-generation"} onClick={closeMenus}>
              <Users className="h-4 w-4 mr-1.5" />
              {t("navLeadGeneration")}
            </NavLink>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme toggle button */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
            
            {/* Language toggle button */}
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300 text-sm font-medium"
            >
              {language === "en" ? "EL" : "EN"}
            </button>

            {/* Auth buttons - Desktop */}
            <div className="hidden md:block">
              {session ? (
                <div className="relative">
                  <button
                    onClick={toggleProfile}
                    className="flex items-center gap-1.5 p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      {session.user?.name?.charAt(0) || <UserIcon className="h-4 w-4" />}
                    </span>
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {session.user?.name || t("user")}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {session.user?.email}
                        </p>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={handleSignOut}
                          className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          {t("signOut")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleSignIn}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-hover transition-colors"
                >
                  <LogIn className="h-4 w-4 mr-1.5" />
                  {t("signIn")}
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
                onClick={toggleMenu}
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden animate-slide-up">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
            <MobileNavLink href="/chat" active={pathname === "/chat"} onClick={closeMenus}>
              <MessageSquare className="h-5 w-5 mr-2" />
              {t("navChat")}
            </MobileNavLink>
            <MobileNavLink href="/knowledge-base" active={pathname === "/knowledge-base"} onClick={closeMenus}>
              <Database className="h-5 w-5 mr-2" />
              {t("navKnowledgeBase")}
            </MobileNavLink>
            <MobileNavLink href="/invoice-automation" active={pathname === "/invoice-automation"} onClick={closeMenus}>
              <FileText className="h-5 w-5 mr-2" />
              {t("navInvoiceAutomation")}
            </MobileNavLink>
            <MobileNavLink href="/lead-generation" active={pathname === "/lead-generation"} onClick={closeMenus}>
              <Users className="h-5 w-5 mr-2" />
              {t("navLeadGeneration")}
            </MobileNavLink>
            
            {/* Auth button - Mobile */}
            {session ? (
              <button
                onClick={handleSignOut}
                className="flex w-full items-center rounded-md py-2 px-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <LogOut className="h-5 w-5 mr-2" />
                {t("signOut")}
              </button>
            ) : (
              <button
                onClick={handleSignIn}
                className="flex w-full items-center rounded-md py-2 px-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <LogIn className="h-5 w-5 mr-2" />
                {t("signIn")}
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

interface NavLinkProps {
  href: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function NavLink({ href, active, onClick, children }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-primary/10 text-primary dark:bg-primary/20"
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
      }`}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ href, active, onClick, children }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`flex items-center rounded-md py-2 px-3 text-base font-medium ${
        active
          ? "bg-primary/10 text-primary dark:bg-primary/20"
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
      onClick={onClick}
    >
      {children}
    </Link>
  );
} 