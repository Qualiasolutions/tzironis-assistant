"use client";

import Link from "next/link";
import { ReactNode } from "react";

interface NavLinkProps {
  href: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

export default function NavLink({ href, active, onClick, children }: NavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        active
          ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
          : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800"
      }`}
    >
      {children}
    </Link>
  );
} 