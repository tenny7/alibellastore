import Link from "next/link";

export default function ProductNotFound() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <p className="text-6xl font-bold text-gray-200 mb-4">404</p>
      <h1 className="text-2xl font-bold text-[#1E293B] mb-2">Product Not Found</h1>
      <p className="text-gray-500 mb-8">
        This product may have been removed or is no longer available.
      </p>
      <Link
        href="/products"
        className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors text-sm"
      >
        Browse Products
      </Link>
    </div>
  );
}
