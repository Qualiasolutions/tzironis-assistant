"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ChatPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to homepage since chat is now integrated there
    router.replace("/");
  }, [router]);

  return (
    <div className="h-screen flex items-center justify-center bg-slate-900">
      <div className="text-white text-center">
        <p>Redirecting to homepage...</p>
      </div>
    </div>
  );
} 