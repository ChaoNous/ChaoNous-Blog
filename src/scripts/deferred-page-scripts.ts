type DeferredPageScript = {
  key: string;
  selector: string;
  load: () => Promise<unknown>;
};

type IdleWindow = Window & {
  requestIdleCallback?: (
    callback: () => void,
    options?: { timeout: number },
  ) => number;
  __cncDeferredPageScriptsInitialized?: boolean;
};

const deferredPageScripts: DeferredPageScript[] = [
  {
    key: "asset-demystification-calculator",
    selector: ".property-calculator",
    load: () => import("./asset-demystification-calculator.ts"),
  },
  {
    key: "btc-analysis-chart",
    selector: "#btc-main-chart, #btc-mini-chart, #btc-table-wrap",
    load: () => import("./btc-analysis-chart.ts"),
  },
  {
    key: "code-collapse",
    selector: ".expressive-code",
    load: () => import("./code-collapse.ts"),
  },
  {
    key: "copy-code-buttons",
    selector: ".copy-btn",
    load: () => import("./copy-code-buttons.ts"),
  },
];

const idleWindow = window as IdleWindow;

if (!idleWindow.__cncDeferredPageScriptsInitialized) {
  idleWindow.__cncDeferredPageScriptsInitialized = true;

  const loadedPageScripts = new Map<string, Promise<unknown>>();

  function scheduleIdleTask(callback: () => void, timeout = 3000): void {
    if (typeof idleWindow.requestIdleCallback === "function") {
      idleWindow.requestIdleCallback(callback, { timeout });
      return;
    }

    globalThis.setTimeout(callback, timeout);
  }

  function loadDeferredPageScripts(): void {
    for (const deferredScript of deferredPageScripts) {
      if (loadedPageScripts.has(deferredScript.key)) {
        continue;
      }

      if (!document.querySelector(deferredScript.selector)) {
        continue;
      }

      const promise = deferredScript.load().catch((error) => {
        loadedPageScripts.delete(deferredScript.key);
        console.warn(
          `[deferred-page-script] Failed to load ${deferredScript.key}`,
          error,
        );
      });

      loadedPageScripts.set(deferredScript.key, promise);
    }
  }

  function scheduleDeferredPageScripts(): void {
    scheduleIdleTask(loadDeferredPageScripts);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleDeferredPageScripts, {
      once: true,
    });
  } else {
    scheduleDeferredPageScripts();
  }

  document.addEventListener("astro:page-load", scheduleDeferredPageScripts);
}
