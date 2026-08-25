"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-7xl font-bold text-red-500 mb-4">!</p>
        <h1 className="text-2xl font-bold text-surface-fg mb-2">Something went wrong</h1>
        <p className="text-surface-muted mb-8">
          An unexpected error occurred. Please try again or contact support if the problem
          persists.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors text-sm"
          >
            Try Again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-surface-border text-surface-fg font-semibold rounded-lg hover:bg-surface-hover transition-colors text-sm"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
