"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const KEY = "alibella-theme";

/** Storefront light/dark switch.
 *  Defaults to the OS preference and only pins a choice once the visitor
 *  makes one, so the site follows the system until told otherwise.
 *  The initial class is applied by an inline script in the root layout —
 *  see ThemeScript — so there is no flash of the wrong theme. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dc-night"));
    setMounted(true);
  }, []);

  // Keep following the OS while the visitor has not chosen explicitly.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    function onChange(e: MediaQueryListEvent) {
      try {
        if (localStorage.getItem(KEY)) return;
      } catch {
        /* storage blocked — fall through and follow the OS */
      }
      document.documentElement.classList.toggle("dc-night", e.matches);
      setDark(e.matches);
    }
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  function toggle() {
    const next = !dark;
    document.documentElement.classList.toggle("dc-night", next);
    setDark(next);
    try {
      localStorage.setItem(KEY, next ? "dark" : "light");
    } catch {
      /* private mode — the choice just won't persist */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={mounted ? dark : undefined}
      className={`flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-cream/[0.12] text-cream transition-colors hover:bg-cream/[0.09] ${className}`}
    >
      {/* Render a stable icon until mounted so SSR and client agree. */}
      {mounted && dark ? (
        <Sun className="h-[17px] w-[17px]" />
      ) : (
        <Moon className="h-[17px] w-[17px]" />
      )}
    </button>
  );
}

/** Runs before first paint. Inline by necessity: reading localStorage in an
 *  effect would repaint after hydration and flash the wrong theme. */
export function ThemeScript() {
  const js = `(function(){try{var s=localStorage.getItem(${JSON.stringify(KEY)});var d=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dc-night")}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
