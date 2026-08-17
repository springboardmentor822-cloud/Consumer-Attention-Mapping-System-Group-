import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Reusable Global Scroll-To-Top Component
 * Ensures every route change or URL navigation resets the scroll position to the top immediately.
 */
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }
    // Reset scroll for all main containers and scrollable wrappers
    const scrollContainers = document.querySelectorAll("main, .overflow-y-auto, [data-scroll-container]");
    scrollContainers.forEach((el) => {
      el.scrollTop = 0;
      if (typeof el.scrollTo === "function") {
        el.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }
    });
  }, [pathname, search]);

  return null;
}
