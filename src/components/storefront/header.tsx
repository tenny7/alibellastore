"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  ShoppingCart,
  User,
  Menu,
  X,
  LogOut,
  Shield,
  Package,
  UserCircle,
  Search,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useCartStore } from "@/store/cart-store";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/storefront/notification-bell";
import type { User as UserType } from "@supabase/supabase-js";
import type { Category } from "@/types";

interface HeaderProps {
  storeName?: string;
  categories?: Category[];
}

export function Header({ storeName = "MoMo Commerce", categories = [] }: HeaderProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const itemCount = useCartStore((s) => s.getItemCount());

  useEffect(() => {
    const supabase = createClient();

    function fetchRole(userId: string) {
      supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single()
        .then(({ data, error }) => {
          if (error) console.error("[Header] role fetch error:", error.message);
          setUserRole(data?.role || null);
        });
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) fetchRole(user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user.id);
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setUserRole(null);
    setDropdownOpen(false);
    router.push("/");
    router.refresh();
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
      setMenuOpen(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <ShoppingBag className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-[#1E293B]">{storeName}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/products"
            className="px-3 py-2 text-sm text-gray-600 hover:text-[#1E293B] rounded-md hover:bg-gray-50 transition-colors"
          >
            Shop
          </Link>
          {categories.slice(0, 4).map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="px-3 py-2 text-sm text-gray-600 hover:text-[#1E293B] rounded-md hover:bg-gray-50 transition-colors"
            >
              {cat.name}
            </Link>
          ))}
          <Link
            href="/about"
            className="px-3 py-2 text-sm text-gray-600 hover:text-[#1E293B] rounded-md hover:bg-gray-50 transition-colors"
          >
            About
          </Link>
        </nav>

        {/* Desktop right actions */}
        <div className="hidden md:flex items-center gap-2">
          {/* Admin button — only visible to admins */}
          {userRole === "admin" && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#1E293B] rounded-md hover:bg-[#334155] transition-colors"
            >
              <Shield className="h-3.5 w-3.5" />
              Admin
            </Link>
          )}

          {/* Search */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 text-gray-500 hover:text-[#1E293B] transition-colors"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Notifications */}
          {user && <NotificationBell />}

          {/* Cart */}
          <Link href="/cart" className="relative p-2 text-gray-500 hover:text-[#1E293B] transition-colors">
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute top-0 right-0 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white animate-[pop_0.3s_ease-out]">
                {itemCount}
              </span>
            )}
          </Link>

          {/* User */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="p-2 text-gray-500 hover:text-[#1E293B] transition-colors"
              >
                <User className="h-5 w-5" />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white border border-[#E2E8F0] rounded-lg shadow-lg py-1 z-50">
                  <div className="px-4 py-2 text-xs text-gray-400 border-b border-[#E2E8F0]">
                    {user.email && !user.email.endsWith("@phone.local")
                      ? user.email
                      : user.user_metadata?.phone || "My Account"}
                  </div>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <UserCircle className="h-4 w-4" />
                    My Profile
                  </Link>
                  <Link
                    href="/orders"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Package className="h-4 w-4" />
                    My Orders
                  </Link>
                  {userRole === "admin" && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Shield className="h-4 w-4" />
                      Admin Panel
                    </Link>
                  )}
                  <div className="border-t border-[#E2E8F0] my-1" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="p-2 text-gray-500 hover:text-[#1E293B] transition-colors">
              <User className="h-5 w-5" />
            </Link>
          )}
        </div>

        {/* Mobile right actions */}
        <div className="flex md:hidden items-center gap-1">
          <button
            onClick={() => { setSearchOpen(!searchOpen); setMenuOpen(false); }}
            className="p-2 text-gray-500"
          >
            <Search className="h-5 w-5" />
          </button>
          {user && <NotificationBell />}
          <Link href="/cart" className="relative p-2">
            <ShoppingCart className="h-5 w-5 text-gray-600" />
            {itemCount > 0 && (
              <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => { setMenuOpen(!menuOpen); setSearchOpen(false); }}
            className="p-2"
          >
            {menuOpen ? (
              <X className="h-5 w-5 text-gray-600" />
            ) : (
              <Menu className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Search bar (slides down) */}
      <div
        className={cn(
          "border-t border-[#E2E8F0] bg-white overflow-hidden transition-all duration-200",
          searchOpen ? "max-h-16" : "max-h-0"
        )}
      >
        <form onSubmit={handleSearch} className="max-w-7xl mx-auto px-4 py-3 flex gap-2">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="flex-1 rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "md:hidden border-t border-[#E2E8F0] bg-white overflow-hidden transition-all duration-200",
          menuOpen ? "max-h-[500px]" : "max-h-0"
        )}
      >
        <nav className="px-4 py-3 space-y-1">
          {/* Admin button — only visible to admins on mobile */}
          {userRole === "admin" && (
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-white bg-[#1E293B] rounded-md mb-2"
              onClick={() => setMenuOpen(false)}
            >
              <Shield className="h-4 w-4" />
              Admin Panel
            </Link>
          )}
          <Link
            href="/products"
            className="block px-3 py-2.5 text-sm font-medium text-[#1E293B] rounded-md hover:bg-gray-50"
            onClick={() => setMenuOpen(false)}
          >
            All Products
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="block px-3 py-2.5 text-sm text-gray-600 rounded-md hover:bg-gray-50"
              onClick={() => setMenuOpen(false)}
            >
              {cat.name}
            </Link>
          ))}
          <Link
            href="/about"
            className="block px-3 py-2.5 text-sm text-gray-600 rounded-md hover:bg-gray-50"
            onClick={() => setMenuOpen(false)}
          >
            About
          </Link>

          <div className="border-t border-[#E2E8F0] my-2" />

          {user ? (
            <>
              <Link href="/profile" className="block px-3 py-2.5 text-sm text-gray-600 rounded-md hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                My Profile
              </Link>
              <Link href="/orders" className="block px-3 py-2.5 text-sm text-gray-600 rounded-md hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                My Orders
              </Link>
              {userRole === "admin" && (
                <Link href="/admin" className="block px-3 py-2.5 text-sm text-gray-600 rounded-md hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                  Admin Panel
                </Link>
              )}
              <button
                onClick={() => { handleLogout(); setMenuOpen(false); }}
                className="block w-full text-left px-3 py-2.5 text-sm text-gray-600 rounded-md hover:bg-gray-50"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/login" className="block px-3 py-2.5 text-sm font-medium text-primary rounded-md hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
