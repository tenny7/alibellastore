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
import { cn, formatCurrency } from "@/lib/utils";
import { NotificationBell } from "@/components/storefront/notification-bell";
import { ThemeToggle } from "@/components/storefront/theme-toggle";
import type { User as UserType } from "@supabase/supabase-js";
import type { Category } from "@/types";

interface HeaderProps {
  storeName?: string;
  categories?: Category[];
  /** Real free-delivery threshold from site settings. The design hardcoded
   *  30,000, which was simply wrong for this store. */
  freeDeliveryThreshold?: number | null;
  currencyCode?: string;
}

export function Header({
  storeName = "MoMo Commerce",
  categories = [],
  freeDeliveryThreshold = null,
  currencyCode = "RWF",
}: HeaderProps) {
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
    <>
      {/* Announcement bar — design: ink bg, cream text, accent dot */}
      <div className="flex items-center justify-center gap-2.5 bg-ink px-5 py-2.5 text-center text-[13px] font-medium leading-none text-cream">
        <span className="hidden h-1.5 w-1.5 shrink-0 rounded-full bg-cream sm:block" />
        <span>
          {freeDeliveryThreshold
            ? `Free delivery on orders over ${formatCurrency(Number(freeDeliveryThreshold), currencyCode)}`
            : "Delivery across Rwanda"}
        </span>
        <span className="hidden opacity-40 sm:inline">·</span>
        <span className="hidden font-bold sm:inline">Pay with MoMo</span>
      </div>

      <header className="sticky top-0 z-40 bg-ink/90 text-cream backdrop-blur-[18px]">
        <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-4 md:px-10">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-cream">
            <ShoppingBag className="h-[17px] w-[17px] text-ink" strokeWidth={2.2} />
          </span>
          <span className="font-display text-[19px] font-bold tracking-[-0.02em] text-cream">
            {storeName}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 rounded-full border border-cream/[0.07] bg-cream/[0.05] p-[5px] md:flex">
          <Link
            href="/products"
            className="rounded-full bg-cream px-[15px] py-2 text-sm font-medium leading-none text-ink transition-colors"
          >
            Shop
          </Link>
          {categories.slice(0, 4).map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="rounded-full px-[15px] py-2 text-sm font-medium leading-none text-cream/[0.66] transition-colors hover:bg-cream/[0.08] hover:text-cream"
            >
              {cat.name}
            </Link>
          ))}
          <Link
            href="/about"
            className="rounded-full px-[15px] py-2 text-sm font-medium leading-none text-cream/[0.66] transition-colors hover:bg-cream/[0.08] hover:text-cream"
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
              className="flex items-center gap-1.5 rounded-[10px] border border-cream/[0.12] px-3 py-2 text-xs font-bold text-cream transition-colors hover:bg-cream/[0.09]"
            >
              <Shield className="h-3.5 w-3.5" />
              Admin
            </Link>
          )}

          <ThemeToggle />

          {/* Search */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Search products"
            className="flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-cream/[0.12] text-cream transition-colors hover:bg-cream/[0.09]"
          >
            <Search className="h-[17px] w-[17px]" />
          </button>

          {/* Notifications */}
          {user && <NotificationBell />}

          {/* Cart */}
          <Link
            href="/cart"
            className="flex h-[38px] items-center gap-2 rounded-xl bg-cream px-4 text-[13px] font-bold leading-none text-ink transition-opacity hover:opacity-90"
          >
            <ShoppingCart className="h-4 w-4" strokeWidth={2.2} />
            <span>Cart{itemCount > 0 ? ` · ${itemCount}` : ""}</span>
          </Link>

          {/* User */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-label="Account menu"
                className="flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-cream/[0.12] text-cream transition-colors hover:bg-cream/[0.09]"
              >
                <User className="h-[17px] w-[17px]" />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 z-50 mt-2 w-52 rounded-2xl border border-cream/[0.12] bg-ink-raised py-1.5 shadow-[0_18px_44px_rgba(11,10,18,.5)]">
                  <div className="border-b border-cream/[0.1] px-4 py-2.5 text-xs text-cream/50">
                    {user.email && !user.email.endsWith("@phone.local")
                      ? user.email
                      : user.user_metadata?.phone || "My Account"}
                  </div>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-cream/75 transition-colors hover:bg-cream/[0.07] hover:text-cream"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <UserCircle className="h-4 w-4" />
                    My Profile
                  </Link>
                  <Link
                    href="/orders"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-cream/75 transition-colors hover:bg-cream/[0.07] hover:text-cream"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Package className="h-4 w-4" />
                    My Orders
                  </Link>
                  {userRole === "admin" && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-cream/75 transition-colors hover:bg-cream/[0.07] hover:text-cream"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Shield className="h-4 w-4" />
                      Admin Panel
                    </Link>
                  )}
                  <div className="my-1 border-t border-cream/[0.1]" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-cream/75 transition-colors hover:bg-cream/[0.07] hover:text-cream"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              aria-label="Sign in"
              className="flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-cream/[0.12] text-cream transition-colors hover:bg-cream/[0.09]"
            >
              <User className="h-[17px] w-[17px]" />
            </Link>
          )}
        </div>

        {/* Mobile right actions */}
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle className="!h-9 !w-9 !border-0" />
          <button
            onClick={() => { setSearchOpen(!searchOpen); setMenuOpen(false); }}
            aria-label="Search products"
            className="p-2 text-cream/80"
          >
            <Search className="h-5 w-5" />
          </button>
          {user && <NotificationBell />}
          <Link href="/cart" aria-label="Cart" className="relative p-2">
            <ShoppingCart className="h-5 w-5 text-cream/80" />
            {itemCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-cream text-[10px] font-bold text-ink">
                {itemCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => { setMenuOpen(!menuOpen); setSearchOpen(false); }}
            aria-label="Menu"
            className="p-2"
          >
            {menuOpen ? (
              <X className="h-5 w-5 text-cream/80" />
            ) : (
              <Menu className="h-5 w-5 text-cream/80" />
            )}
          </button>
        </div>
      </div>

      {/* Search bar (slides down) */}
      <div
        className={cn(
          "overflow-hidden border-t border-cream/[0.1] bg-ink transition-all duration-200",
          searchOpen ? "max-h-16" : "max-h-0"
        )}
      >
        <form onSubmit={handleSearch} className="mx-auto flex max-w-[1320px] gap-2 px-4 py-3 md:px-10">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="flex-1 rounded-xl border border-cream/20 bg-cream/[0.06] px-4 py-2.5 text-sm text-cream placeholder:text-cream/40 focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-xl bg-cream px-5 py-2.5 text-sm font-bold text-ink transition-opacity hover:opacity-90"
          >
            Search
          </button>
        </form>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "overflow-hidden border-t border-cream/[0.1] bg-ink transition-all duration-200 md:hidden",
          menuOpen ? "max-h-[500px]" : "max-h-0"
        )}
      >
        <nav className="px-4 py-3 space-y-1">
          {/* Admin button — only visible to admins on mobile */}
          {userRole === "admin" && (
            <Link
              href="/admin"
              className="mb-2 flex items-center gap-2 rounded-xl bg-cream px-3 py-2.5 text-sm font-bold text-ink"
              onClick={() => setMenuOpen(false)}
            >
              <Shield className="h-4 w-4" />
              Admin Panel
            </Link>
          )}
          <Link
            href="/products"
            className="block rounded-xl px-3 py-2.5 text-sm font-medium text-cream hover:bg-cream/[0.07]"
            onClick={() => setMenuOpen(false)}
          >
            All Products
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="block rounded-xl px-3 py-2.5 text-sm text-cream/70 hover:bg-cream/[0.07] hover:text-cream"
              onClick={() => setMenuOpen(false)}
            >
              {cat.name}
            </Link>
          ))}
          <Link
            href="/about"
            className="block rounded-xl px-3 py-2.5 text-sm text-cream/70 hover:bg-cream/[0.07] hover:text-cream"
            onClick={() => setMenuOpen(false)}
          >
            About
          </Link>

          <div className="my-2 border-t border-cream/[0.1]" />

          {user ? (
            <>
              <Link href="/profile" className="block rounded-xl px-3 py-2.5 text-sm text-cream/70 hover:bg-cream/[0.07] hover:text-cream" onClick={() => setMenuOpen(false)}>
                My Profile
              </Link>
              <Link href="/orders" className="block rounded-xl px-3 py-2.5 text-sm text-cream/70 hover:bg-cream/[0.07] hover:text-cream" onClick={() => setMenuOpen(false)}>
                My Orders
              </Link>
              {userRole === "admin" && (
                <Link href="/admin" className="block rounded-xl px-3 py-2.5 text-sm text-cream/70 hover:bg-cream/[0.07] hover:text-cream" onClick={() => setMenuOpen(false)}>
                  Admin Panel
                </Link>
              )}
              <button
                onClick={() => { handleLogout(); setMenuOpen(false); }}
                className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-cream/70 hover:bg-cream/[0.07] hover:text-cream"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/login" className="block rounded-xl px-3 py-2.5 text-sm font-bold text-cream hover:bg-cream/[0.07]" onClick={() => setMenuOpen(false)}>
              Sign In
            </Link>
          )}
        </nav>
      </div>
      </header>
    </>
  );
}
