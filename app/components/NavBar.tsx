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
  ChevronDown,
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/90 dark:bg-slate-900/90 shadow-md backdrop-blur-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center" onClick={closeMenus} aria-label="Home">
              <Brain className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-semibold text-slate-900 dark:text-white">QUALIA</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <NavLink href="/chat" active={pathname === "/chat"} onClick={closeMenus}>
              <MessageSquare className="h-5 w-5 mr-1" />
              <span>{t("navChat")}</span>
            </NavLink>
            <NavLink href="/knowledge-base" active={pathname === "/knowledge-base"} onClick={closeMenus}>
              <Database className="h-5 w-5 mr-1" />
              <span>{t("navKnowledgeBase")}</span>
            </NavLink>
            <NavLink href="/invoice-automation" active={pathname === "/invoice-automation"} onClick={closeMenus}>
              <FileText className="h-5 w-5 mr-1" />
              <span>{t("navInvoiceAutomation")}</span>
            </NavLink>
            <NavLink href="/lead-generation" active={pathname === "/lead-generation"} onClick={closeMenus}>
              <Users className="h-5 w-5 mr-1" />
              <span>{t("navLeadGeneration")}</span>
            </NavLink>
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-2">
            {/* Theme toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              aria-label={isDarkMode ? "Light Mode" : "Dark Mode"}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Language toggle */}
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              aria-label="Switch Language"
            >
              {language === "en" ? "EL" : "EN"}
            </button>

            {/* Profile/Auth */}
            <div className="relative">
              <button
                onClick={toggleProfile}
                className="flex items-center p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                aria-expanded={isProfileOpen}
                aria-haspopup="true"
              >
                {session ? (
                  <div className="flex items-center">
                    {session.user?.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || "Profile"}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <UserIcon className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                    )}
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </div>
                ) : (
                  <UserIcon className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                )}
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 py-2 bg-white dark:bg-slate-800 rounded-md shadow-lg z-50 ring-1 ring-black ring-opacity-5">
                  {session ? (
                    <>
                      <div className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 border-b dark:border-slate-700">
                        <p className="font-medium truncate">{session.user?.name}</p>
                        <p className="text-xs truncate">{session.user?.email}</p>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        {t("signOut")}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleSignIn}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center"
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      {t("signIn")}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                aria-controls="mobile-menu"
                aria-expanded={isMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 shadow-lg" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
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
      onClick={onClick}
      className={`nav-link flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        active
          ? "text-primary dark:text-primary-hover bg-primary/5 dark:bg-primary/10"
          : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
      }`}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ href, active, onClick, children }: NavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center w-full px-3 py-3 rounded-md text-base font-medium ${
        active
          ? "text-primary dark:text-primary-hover bg-primary/5 dark:bg-primary/10"
          : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
      }`}
    >
      {children}
    </Link>
  );
} 