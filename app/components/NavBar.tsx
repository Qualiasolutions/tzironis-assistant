"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  Menu, 
  X,
  ChevronDown,
} from "lucide-react";
import { useLanguage } from "@/app/lib/LanguageContext";
import ThemeToggle from "./navigation/ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import ProfileMenu from "./navigation/ProfileMenu";
import MobileMenu from "./navigation/MobileMenu";
import NavLink from "./navigation/NavLink";

export default function NavBar() {
  const { t } = useLanguage();
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
    setIsDarkMode(!isDarkMode);
    
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (isProfileOpen) setIsProfileOpen(false);
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
    if (isMenuOpen) setIsMenuOpen(false);
  };

  const closeMenus = () => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  };

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
      scrolled ? "bg-white shadow-md dark:bg-gray-900" : "bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link href="/" onClick={closeMenus}>
              <div className="flex items-center">
                <div className="flex items-center justify-center h-9 w-9 bg-opacity-10 bg-primary dark:bg-opacity-20 dark:bg-primary rounded-full overflow-hidden mr-2">
                  <Image 
                    src="/icons/logo.png" 
                    alt="Tzironis Logo" 
                    width={32} 
                    height={32}
                    className="object-contain"
                  />
                </div>
                <span className="text-primary text-xl font-bold">Tzironis</span>
              </div>
            </Link>
          </div>

          {/* Desktop navigation links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <NavLink href="/" active={pathname === "/"} onClick={closeMenus}>
                Home
              </NavLink>
              
              <NavLink href="/knowledge-base" active={pathname.includes("/knowledge-base")} onClick={closeMenus}>
                {t("navKnowledgeBase")}
              </NavLink>
              
              <NavLink href="/invoice-automation" active={pathname.includes("/invoice-automation")} onClick={closeMenus}>
                {t("navInvoiceAutomation")}
              </NavLink>
              
              <NavLink href="/lead-generation" active={pathname.includes("/lead-generation")} onClick={closeMenus}>
                {t("navLeadGeneration")}
              </NavLink>
            </div>
          </div>

          {/* Right side buttons and controls */}
          <div className="flex items-center space-x-2">
            <ThemeToggle isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
            <LanguageSwitcher />
            
            {/* Profile/login section */}
            {session ? (
              <div className="relative">
                <button
                  onClick={toggleProfile}
                  className="flex items-center space-x-1 text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary transition px-3 py-2 rounded-md"
                >
                  <img 
                    src={session.user?.image || "/icons/logo.png"} 
                    alt={session.user?.name || "User"} 
                    className="h-8 w-8 rounded-full border-2 border-primary"
                  />
                  <ChevronDown size={16} />
                </button>
                
                {isProfileOpen && (
                  <ProfileMenu session={session} closeMenu={closeMenus} />
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <NavLink href="/auth/signin" active={false} onClick={closeMenus}>
                  Sign In
                </NavLink>
              </div>
            )}
            
            {/* Mobile menu button */}
            <div className="md:hidden flex">
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary focus:outline-none"
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <MobileMenu pathname={pathname} closeMenu={closeMenus} />
      )}
    </nav>
  );
} 