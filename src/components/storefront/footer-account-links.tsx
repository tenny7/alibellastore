"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function FooterAccountLinks() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setLoggedIn(!!user);
    });
  }, []);

  // While loading, show profile link only (avoids flicker)
  if (loggedIn === null) {
    return (
      <ul className="space-y-2.5">
        <li>
          <Link href="/profile" className="text-sm text-gray-400 hover:text-white transition-colors">
            My Profile
          </Link>
        </li>
      </ul>
    );
  }

  if (loggedIn) {
    return (
      <ul className="space-y-2.5">
        <li>
          <Link href="/profile" className="text-sm text-gray-400 hover:text-white transition-colors">
            My Profile
          </Link>
        </li>
        <li>
          <Link href="/orders" className="text-sm text-gray-400 hover:text-white transition-colors">
            My Orders
          </Link>
        </li>
      </ul>
    );
  }

  return (
    <ul className="space-y-2.5">
      <li>
        <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
          Sign In
        </Link>
      </li>
      <li>
        <Link href="/signup" className="text-sm text-gray-400 hover:text-white transition-colors">
          Create Account
        </Link>
      </li>
    </ul>
  );
}
