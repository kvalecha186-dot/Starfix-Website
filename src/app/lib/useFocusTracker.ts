import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { addXp, XP_SOURCES } from "./xpSystem";

/* ─────────────────────────────────────────────────────────────────────────
   useFocusTracker — awards Focus XP after 25 *uninterrupted* minutes on a
   lesson or project. "Uninterrupted" means the tab stayed visible/active
   the whole time; switching tabs or hiding the window resets the clock,
   matching "deep work" rather than just elapsed wall-clock time.
   Usage: useFocusTracker(true) while a workspace/lesson view is mounted.
───────────────────────────────────────────────────────────────────────── */

const FOCUS_MINUTES = 25;
const FOCUS_MS = FOCUS_MINUTES * 60 * 1000;

export function useFocusTracker(active: boolean) {
  const startedAt = useRef<number | null>(null);
  const timeoutId = useRef<number | null>(null);

  useEffect(() => {
    function clear() {
      if (timeoutId.current) { window.clearTimeout(timeoutId.current); timeoutId.current = null; }
      startedAt.current = null;
    }

    function start() {
      clear();
      startedAt.current = Date.now();
      timeoutId.current = window.setTimeout(() => {
        addXp(XP_SOURCES.focusSession, "Deep work");
        toast.success("Deep work +25 Focus XP", {
          description: "You stayed focused for 25 minutes.",
          position: "top-center",
        });
        // Re-arm for another 25-minute block if still active.
        start();
      }, FOCUS_MS);
    }

    function onVisibilityChange() {
      if (document.hidden) clear();
      else if (active) start();
    }

    if (active && !document.hidden) start();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clear();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [active]);
}
