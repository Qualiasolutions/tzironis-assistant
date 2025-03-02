"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { useLanguage } from "@/app/lib/LanguageContext";
import { Suspense } from "react";

// Create a client component that uses the search params
function AuthErrorContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  // Map error codes to messages
  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case "Configuration":
        return t("errorConfiguration");
      case "AccessDenied":
        return t("errorAccessDenied");
      case "Verification":
        return t("errorVerification");
      case "OAuthSignin":
      case "OAuthCallback":
      case "OAuthCreateAccount":
      case "EmailCreateAccount":
      case "Callback":
      case "OAuthAccountNotLinked":
      case "EmailSignin":
      case "CredentialsSignin":
        return t("errorSignIn");
      case "SessionRequired":
        return t("errorSessionRequired");
      default:
        return t("errorUnknown");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
        <div className="flex items-center justify-center">
          <div className="rounded-full bg-red-100 p-3">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <div className="mt-4 text-center">
          <h1 className="text-xl font-bold text-gray-900">{t("authError")}</h1>
          <p className="mt-2 text-gray-600">{getErrorMessage(error)}</p>
        </div>
        <div className="mt-6 flex justify-center">
          <Link
            href="/auth/signin"
            className="mr-3 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-accent"
          >
            {t("tryAgain")}
          </Link>
          <Link
            href="/"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t("backToHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}

// Main component that uses Suspense
export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  );
} 