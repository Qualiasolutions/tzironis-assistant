"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { LogIn, LogOut, User, ChevronDown } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useLanguage } from "@/app/lib/LanguageContext";

export default function AuthButton() {
  const { data: session, status } = useSession();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200"></div>
    );
  }

  if (!session) {
    return (
      <button
        onClick={() => signIn()}
        className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-accent transition-colors"
      >
        <LogIn className="h-4 w-4" />
        <span>{t("signIn")}</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-4 w-4" />
          </div>
          <span className="max-w-[100px] truncate">
            {session.user?.name || t("user")}
          </span>
        </div>
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="px-4 py-2 text-xs text-gray-500">
            {session.user?.email}
            {session.user?.role && (
              <span className="mt-1 block rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                {session.user.role}
              </span>
            )}
          </div>
          <hr className="my-1" />
          <Link
            href="/profile"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            {t("profile")}
          </Link>
          <Link
            href="/settings"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            {t("settings")}
          </Link>
          <hr className="my-1" />
          <button
            onClick={() => {
              setIsOpen(false);
              signOut({ callbackUrl: "/" });
            }}
            className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t("signOut")}
          </button>
        </div>
      )}
    </div>
  );
} 