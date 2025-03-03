"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Session } from "next-auth";
import { useLanguage } from "@/app/lib/LanguageContext";

interface ProfileMenuProps {
  session: Session;
  closeMenu: () => void;
}

export default function ProfileMenu({ session, closeMenu }: ProfileMenuProps) {
  const { t } = useLanguage();

  const handleSignOut = () => {
    signOut();
    closeMenu();
  };

  return (
    <div className="absolute right-0 mt-2 w-48 py-2 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 ring-1 ring-black ring-opacity-5">
      <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b dark:border-gray-700">
        <p className="font-medium truncate">{session.user?.name}</p>
        <p className="text-xs truncate">{session.user?.email}</p>
      </div>
      <button
        onClick={handleSignOut}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
      >
        <LogOut className="mr-2 h-4 w-4" />
        {t("signOut")}
      </button>
    </div>
  );
} 