"use client";

import Link from "next/link";
import { MessageSquare, Database, FileText, Users } from "lucide-react";
import { useLanguage } from "@/app/lib/LanguageContext";

interface MobileMenuProps {
  pathname: string;
  closeMenu: () => void;
}

export default function MobileMenu({ pathname, closeMenu }: MobileMenuProps) {
  const { t } = useLanguage();
  
  return (
    <div className="md:hidden bg-white dark:bg-gray-900 shadow-lg">
      <div className="px-2 pt-2 pb-3 space-y-1">
        <MobileNavLink href="/" active={pathname === "/"} onClick={closeMenu}>
          Home
        </MobileNavLink>
        <MobileNavLink href="/chat" active={pathname === "/chat"} onClick={closeMenu}>
          <MessageSquare className="h-5 w-5 mr-2" />
          {t("navChat")}
        </MobileNavLink>
        <MobileNavLink href="/knowledge-base" active={pathname.includes("/knowledge-base")} onClick={closeMenu}>
          <Database className="h-5 w-5 mr-2" />
          {t("navKnowledgeBase")}
        </MobileNavLink>
        <MobileNavLink href="/invoice-automation" active={pathname.includes("/invoice-automation")} onClick={closeMenu}>
          <FileText className="h-5 w-5 mr-2" />
          {t("navInvoiceAutomation")}
        </MobileNavLink>
        <MobileNavLink href="/lead-generation" active={pathname.includes("/lead-generation")} onClick={closeMenu}>
          <Users className="h-5 w-5 mr-2" />
          {t("navLeadGeneration")}
        </MobileNavLink>
      </div>
    </div>
  );
}

interface MobileNavLinkProps {
  href: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function MobileNavLink({ href, active, onClick, children }: MobileNavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center w-full px-3 py-3 rounded-md text-base font-medium ${
        active
          ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
          : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800"
      }`}
    >
      {children}
    </Link>
  );
} 