"use client";

import { useEffect } from "react";
import { Moon, Sun } from "lucide-react";

const KEY = "alibella-theme";

/** Storefront light/dark switch.
 *  Defaults to the OS preference and only pins a choice once the visitor makes
 *  one, so the site follows the system until told otherwise.
 *
 *  Holds no React state: the <html> class is the single source of truth and the
 *  two icons are swapped in CSS (.dc-night). That avoids both a hydration
 *  mismatch and a setState-in-effect, since the server cannot know the theme. */
export function ThemeToggle({ className = "" }: { className?: string }) {
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
    }
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  function toggle() {
    const root = document.documentElement;
    const next = !root.classList.contains("dc-night");
    root.classList.toggle("dc-night", next);
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
      aria-label="Toggle dark theme"
      className={`flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-cream/[0.12] text-cream transition-colors hover:bg-cream/[0.09] ${className}`}
    >
      <Moon className="dc-when-light h-[17px] w-[17px]" />
      <Sun className="dc-when-dark h-[17px] w-[17px]" />
    </button>
  );
}

/** Runs before first paint. Inline by necessity: reading localStorage in an
 *  effect would repaint after hydration and flash the wrong theme. */
export function ThemeScript() {
  const js = `(function(){try{var s=localStorage.getItem(${JSON.stringify(KEY)});var d=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dc-night")}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
