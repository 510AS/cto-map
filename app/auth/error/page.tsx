"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const errorMessages: Record<string, string> = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "Access denied. You do not have permission.",
  Verification: "The verification link has expired or has already been used.",
  Default: "An authentication error occurred.",
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || "Default";
  const message = errorMessages[error] || errorMessages.Default;

  return (
    <div className="w-full max-w-md text-center space-y-6">
      <div className="text-6xl">⚠️</div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Authentication Error
      </h1>
      <p className="text-gray-600 dark:text-gray-400">{message}</p>
      <Link
        href="/auth/login"
        className="min-h-[44px] inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
      >
        Back to login
      </Link>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-950">
      <Suspense fallback={<div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />}>
        <AuthErrorContent />
      </Suspense>
    </div>
  );
}
