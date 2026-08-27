import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-7xl font-bold text-surface-fg mb-4">404</p>
        <h1 className="text-2xl font-bold text-surface-fg mb-2">Page Not Found</h1>
        <p className="text-surface-muted mb-8">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or
          deleted.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-page-fg text-white font-semibold rounded-lg hover:opacity-90 transition-colors text-sm"
          >
            Go Home
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center px-6 py-3 border border-surface-border text-surface-fg font-semibold rounded-lg hover:bg-surface-hover transition-colors text-sm"
          >
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  );
}
