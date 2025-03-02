"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Brain, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import AuthButton from './AuthButton';

interface NavItem {
  href: string;
  labelKey: string;
}

const navItems: NavItem[] = [
  { href: '/chat', labelKey: 'navChat' },
  { href: '/knowledge-base', labelKey: 'navKnowledgeBase' },
  { href: '/invoice-automation', labelKey: 'navInvoiceAutomation' },
  { href: '/lead-generation', labelKey: 'navLeadGeneration' },
];

export default function NavBar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className={`sticky top-0 z-50 w-full border-b transition-all duration-200 ${
      scrolled ? 'bg-white shadow-sm' : 'bg-white'
    }`}>
      <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
        <Link href="/" className="flex items-center space-x-2" onClick={closeMenu}>
          <Brain className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-primary">Qualia</span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm transition-colors ${
                pathname === item.href
                  ? 'text-primary font-medium'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              {t(item.labelKey)}
            </Link>
          ))}
          <Link
            href="https://tzironis.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-primary font-medium hover:text-primary/80 transition-colors"
          >
            tzironis.gr
          </Link>
          
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <AuthButton />
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center space-x-3">
          <LanguageSwitcher />
          <AuthButton />
          <button
            className="text-gray-700 hover:text-primary focus:outline-none"
            onClick={toggleMenu}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-white shadow-md">
          <div className="flex flex-col py-4 px-6 space-y-4 border-t">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm transition-colors ${
                  pathname === item.href
                    ? 'text-primary font-medium'
                    : 'text-gray-600 hover:text-primary'
                }`}
                onClick={closeMenu}
              >
                {t(item.labelKey)}
              </Link>
            ))}
            <Link
              href="https://tzironis.gr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-primary font-medium hover:text-primary/80 transition-colors"
              onClick={closeMenu}
            >
              tzironis.gr
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
} 