"use client";

import { useEffect } from "react";
import { Moon, Sun } from "lucide-react";

const KEY = "alibella-theme";

/** Storefront theme switch.
 *  Store v2 is dark-first, so dark is the default and light is the opt-in
 *  variant, applied as .dc-light on <html>. Defaults to the OS preference and
 *  only pins a choice once the visitor makes one.
 *
 *  Holds no React state: the <html> class is the single source of truth and the
 *  icons swap in CSS. That avoids a hydration mismatch and a setState-in-effect,
 *  since the server cannot know the visitor's theme. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    function onChange(e: MediaQueryListEvent) {
      try {
        if (localStorage.getItem(KEY)) return;
      } catch {
        /* storage blocked — fall through and follow the OS */
      }
      document.documentElement.classList.toggle("dc-light", e.matches);
    }
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  function toggle() {
    const root = document.documentElement;
    const nextLight = !root.classList.contains("dc-light");
    root.classList.toggle("dc-light", nextLight);
    try {
      localStorage.setItem(KEY, nextLight ? "light" : "dark");
    } catch {
      /* private mode — the choice just won't persist */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle light theme"
      className={`flex h-9 w-9 items-center justify-center rounded-full border border-page-fg/25 text-page-fg/70 transition-colors hover:border-accent hover:text-accent ${className}`}
    >
      <Sun className="dc-when-dark h-[15px] w-[15px]" />
      <Moon className="dc-when-light h-[15px] w-[15px]" />
    </button>
  );
}

/** Runs before first paint. Inline by necessity: reading localStorage in an
 *  effect would repaint after hydration and flash the wrong theme. */
export function ThemeScript() {
  const js = `(function(){try{var s=localStorage.getItem(${JSON.stringify(KEY)});var light=s?s==="light":window.matchMedia("(prefers-color-scheme: light)").matches;if(light)document.documentElement.classList.add("dc-light")}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
