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
          <Link href="/profile" className="text-[14.5px] text-cream/70 transition-colors hover:text-cream">
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
          <Link href="/profile" className="text-[14.5px] text-cream/70 transition-colors hover:text-cream">
            My Profile
          </Link>
        </li>
        <li>
          <Link href="/orders" className="text-[14.5px] text-cream/70 transition-colors hover:text-cream">
            My Orders
          </Link>
        </li>
      </ul>
    );
  }

  return (
    <ul className="space-y-2.5">
      <li>
        <Link href="/login" className="text-[14.5px] text-cream/70 transition-colors hover:text-cream">
          Sign In
        </Link>
      </li>
      <li>
        <Link href="/signup" className="text-[14.5px] text-cream/70 transition-colors hover:text-cream">
          Create Account
        </Link>
      </li>
    </ul>
  );
}
