import { registerPageScript } from "../page-lifecycle.ts";

const pagefindScriptUrl = import.meta.env.PROD ? "/pagefind/pagefind.js" : "";

if (pagefindScriptUrl) {
  registerPageScript("navbar-pagefind-loader", {
    shouldRun() {
      return document.getElementById("search-container") !== null;
    },
    init() {
      let cancelled = false;
      let pagefindLoaded = false;
      const searchContainer = document.getElementById("search-container");

      async function initPagefind() {
        if (pagefindLoaded || cancelled) return;
        pagefindLoaded = true;

        try {
          const pagefind = await import(pagefindScriptUrl);
          await pagefind.options({ excerptLength: 20 });
          if (cancelled) return;
          window.pagefind = pagefind;
          document.dispatchEvent(new CustomEvent("pagefindready"));
        } catch (error) {
          console.error("Failed to load Pagefind:", error);
          window.pagefind = {
            search: () => Promise.resolve({ results: [] }),
          };
          document.dispatchEvent(new CustomEvent("pagefindloaderror"));
        }
      }

      if (searchContainer) {
        searchContainer.addEventListener("click", initPagefind, {
          once: true,
        });
        searchContainer.addEventListener("focusin", initPagefind, {
          once: true,
        });
      }

      return () => {
        cancelled = true;
      };
    },
  });
}
