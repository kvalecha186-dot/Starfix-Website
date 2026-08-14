import { useEffect, useState } from "react";

/* ─────────────────────────────────────────────────────────────────────────
   useViewport — the single source of truth for responsive branching across
   Starfix. Desktop (1024px+) always renders through the exact same code
   path it always has; components branch on isMobile/isTablet ONLY to add
   new mobile/tablet behavior, never to alter what desktop sees. This is a
   JS breakpoint (not a CSS media query) specifically so "desktop stays
   pixel-identical" is guaranteed by the same values the app already
   renders, not by trusting cascade/specificity to not leak across a
   codebase built almost entirely from inline style objects.
───────────────────────────────────────────────────────────────────────── */

export const BREAKPOINT_TABLET = 768;
export const BREAKPOINT_DESKTOP = 1024;

export interface Viewport {
  width: number;
  isMobile: boolean;   // 0–767
  isTablet: boolean;   // 768–1023
  isDesktop: boolean;  // 1024+
  isCompact: boolean;  // mobile OR tablet — "not full desktop"
}

function computeViewport(width: number): Viewport {
  const isMobile = width < BREAKPOINT_TABLET;
  const isTablet = width >= BREAKPOINT_TABLET && width < BREAKPOINT_DESKTOP;
  const isDesktop = width >= BREAKPOINT_DESKTOP;
  return { width, isMobile, isTablet, isDesktop, isCompact: isMobile || isTablet };
}

export function useViewport(): Viewport {
  const [vp, setVp] = useState<Viewport>(() =>
    computeViewport(typeof window !== "undefined" ? window.innerWidth : 1280)
  );

  useEffect(() => {
    let frame: number | null = null;
    const onResize = () => {
      if (frame != null) return;
      frame = window.requestAnimationFrame(() => {
        frame = null;
        setVp(computeViewport(window.innerWidth));
      });
    };
    window.addEventListener("resize", onResize);
    onResize();
    return () => {
      window.removeEventListener("resize", onResize);
      if (frame != null) window.cancelAnimationFrame(frame);
    };
  }, []);

  return vp;
}
