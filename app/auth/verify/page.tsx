"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;

    async function verifyToken() {
      try {
        const res = await fetch(`/api/auth/verify?token=${token}`);
        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage(data.message);
        } else {
          setStatus("error");
          setMessage(data.error);
        }
      } catch {
        setStatus("error");
        setMessage("Verification failed. Please try again.");
      }
    }

    verifyToken();
  }, [token]);

  // Waiting for user to check email
  if (!token && email) {
    return (
      <div className="w-full max-w-md text-center space-y-6">
        <div className="text-6xl">📧</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Check your email
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          We sent a verification link to{" "}
          <span className="font-medium text-gray-900 dark:text-gray-100">{email}</span>.
          Click the link to activate your account.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Didn&apos;t receive it? Check your spam folder or click below to resend.
        </p>
        <ResendButton email={email} />
        <Link
          href="/auth/login"
          className="inline-block text-blue-600 dark:text-blue-400 font-medium hover:underline"
        >
          Back to login
        </Link>
      </div>
    );
  }

  // Verifying token
  return (
    <div className="w-full max-w-md text-center space-y-6">
      {status === "pending" && (
        <>
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Verifying your email...
          </h1>
        </>
      )}

      {status === "success" && (
        <>
          <div className="text-6xl">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Email verified
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{message}</p>
          <Link
            href="/auth/login"
            className="min-h-[44px] inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
          >
            Go to login
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <div className="text-6xl">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Verification failed
          </h1>
          <p className="text-red-600 dark:text-red-400">{message}</p>
          <Link
            href="/auth/register"
            className="inline-block text-blue-600 dark:text-blue-400 font-medium hover:underline"
          >
            Try registering again
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-950">
      <Suspense fallback={<div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />}>
        <VerifyContent />
      </Suspense>
    </div>
  );
}

function ResendButton({ email }: { email: string }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleResend() {
    setLoading(true);
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <p className="text-sm text-green-600 dark:text-green-400">
        Verification email resent ✓
      </p>
    );
  }

  return (
    <button
      onClick={handleResend}
      disabled={loading}
      className="min-h-[44px] px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 disabled:opacity-50 transition-colors"
    >
      {loading ? "Sending..." : "Resend verification email"}
    </button>
  );
}
