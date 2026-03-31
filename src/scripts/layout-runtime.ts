import { pathsEqual, url } from "../utils/url-utils";
import { DARK_MODE, DEFAULT_THEME } from "../constants/constants";
import { BANNER_HEIGHT } from "../constants/constants";
import {
  cleanupBannerRuntime,
  revealBanner,
  syncBannerHeightExtend,
} from "./layout-runtime/banner-runtime";
import {
  handleNavbarLinkClick,
  refreshNavbarTransparency,
  syncNavbarHomeState,
  syncNavbarVisibility,
} from "./layout-runtime/navbar-runtime";
import {
  clearTocNotReady,
  initializeArticleToc,
  markTocNotReady,
  syncDesktopTocVisibility,
} from "./layout-runtime/toc-runtime";
const bannerEnabled = !!document.getElementById("banner-wrapper");
const IDLE_FALLBACK_DELAY = 100;

let panelManagerInitialization: Promise<unknown> | null = null;

function isCurrentPostPage() {
  return (
    document.querySelector('#swup-container[data-is-post-page="true"]') !== null
  );
}

function removePostPageActionButtons() {
  if (!isCurrentPostPage()) {
    return;
  }

  document.getElementById("floating-toc-btn")?.remove();
  document.getElementById("floating-toc-panel")?.remove();
  document.querySelector(".floating-toc-wrapper")?.remove();

  const floatingTocWindow = window as Window & {
    __floatingTocInstance?: { destroy?: () => void } | null;
  };
  floatingTocWindow.__floatingTocInstance?.destroy?.();
  floatingTocWindow.__floatingTocInstance = null;
}

function scheduleIdleTask(task: () => void, timeout = IDLE_FALLBACK_DELAY) {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(task);
    return;
  }

  globalThis.setTimeout(task, timeout);
}

function runOnDocumentReady(callback: () => void | Promise<void>) {
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        void callback();
      },
      { once: true },
    );
    return;
  }

  void callback();
}

async function initializePanelManager() {
  if (!panelManagerInitialization) {
    panelManagerInitialization = (async () => {
      try {
        const { panelManager } = await import("../utils/panel-manager");

        function setClickOutsideToClose(panel: string, ignores: string[]) {
          document.addEventListener("click", async (event) => {
            const target = event.target;
            if (!(target instanceof Node)) return;

            for (const ignoreId of ignores) {
              const ignoreElement = document.getElementById(ignoreId);
              if (ignoreElement === target || ignoreElement?.contains(target)) {
                return;
              }
            }

            await panelManager.closePanel(panel as any);
          });
        }

        setClickOutsideToClose("display-setting", [
          "display-setting",
          "display-settings-switch",
        ]);
        setClickOutsideToClose("nav-menu-panel", [
          "nav-menu-panel",
          "nav-menu-switch",
        ]);
        setClickOutsideToClose("search-panel", [
          "search-panel",
          "search-bar",
          "search-switch",
        ]);

        return panelManager;
      } catch (error) {
        console.error("Failed to initialize panel manager:", error);
        return null;
      }
    })();
  }

  return panelManagerInitialization;
}

void initializePanelManager();
scheduleIdleTask(initCustomScrollbar);

function initCustomScrollbar() {
  const katexElements = document.querySelectorAll(
    ".katex-display:not([data-scrollbar-initialized])",
  ) as NodeListOf<HTMLElement>;

  katexElements.forEach((element) => {
    if (!element.parentNode) return;

    const container = document.createElement("div");
    container.className = "katex-display-container";
    element.parentNode.insertBefore(container, element);
    container.appendChild(element);

    container.style.cssText = `
            overflow-x: auto;
            scrollbar-width: thin;
            scrollbar-color: rgba(0,0,0,0.3) transparent;
        `;

    const style = document.createElement("style");
    style.textContent = `
            .katex-display-container::-webkit-scrollbar {
                height: 6px;
            }
            .katex-display-container::-webkit-scrollbar-track {
                background: transparent;
            }
            .katex-display-container::-webkit-scrollbar-thumb {
                background: rgba(0,0,0,0.3);
                border-radius: 3px;
            }
            .katex-display-container::-webkit-scrollbar-thumb:hover {
                background: rgba(0,0,0,0.5);
            }
        `;

    if (!document.head.querySelector("style[data-katex-scrollbar]")) {
      style.setAttribute("data-katex-scrollbar", "true");
      document.head.appendChild(style);
    }

    element.setAttribute("data-scrollbar-initialized", "true");
  });
}

let fancyboxSelectors: string[] = [];
let Fancybox: any;
let fancyboxStylesLoaded = false;

function checkKatex() {
  if (document.querySelector(".katex")) {
    import("katex/dist/katex.css");
  }
}

async function initFancybox() {
  const albumImagesSelector =
    ".custom-md img, #post-cover img, .moment-images img";
  const albumLinksSelector = ".moment-images a[data-fancybox]";
  const singleFancyboxSelector = "[data-fancybox]:not(.moment-images a)";

  const hasImages =
    document.querySelector(albumImagesSelector) ||
    document.querySelector(albumLinksSelector) ||
    document.querySelector(singleFancyboxSelector);

  if (!hasImages) return;

  if (!Fancybox) {
    const mod = await import("@fancyapps/ui");
    Fancybox = mod.Fancybox;
    await import("@fancyapps/ui/dist/fancybox/fancybox.css");
  }

  if (!fancyboxStylesLoaded) {
    await import("../styles/fancybox-custom.css");
    fancyboxStylesLoaded = true;
  }

  if (fancyboxSelectors.length > 0) {
    return;
  }

  const commonConfig = {
    Thumbs: { autoStart: true, showOnStart: "yes" },
    Toolbar: {
      display: {
        left: ["infobar"],
        middle: [
          "zoomIn",
          "zoomOut",
          "toggle1to1",
          "rotateCCW",
          "rotateCW",
          "flipX",
          "flipY",
        ],
        right: ["slideshow", "thumbs", "close"],
      },
    },
    animated: true,
    dragToClose: true,
    keyboard: {
      Escape: "close",
      Delete: "close",
      Backspace: "close",
      PageUp: "next",
      PageDown: "prev",
      ArrowUp: "next",
      ArrowDown: "prev",
      ArrowRight: "next",
      ArrowLeft: "prev",
    },
    fitToView: true,
    preload: 3,
    infinite: true,
    Panzoom: { maxScale: 3, minScale: 1 },
    caption: false,
  };

  Fancybox.bind(albumImagesSelector, {
    ...commonConfig,
    groupAll: true,
    Carousel: {
      transition: "slide",
      preload: 2,
    },
  });
  fancyboxSelectors.push(albumImagesSelector);

  Fancybox.bind(albumLinksSelector, {
    ...commonConfig,
    source: (el: any) => {
      return el.getAttribute("data-src") || el.getAttribute("href");
    },
  });
  fancyboxSelectors.push(albumLinksSelector);

  Fancybox.bind(singleFancyboxSelector, commonConfig);
  fancyboxSelectors.push(singleFancyboxSelector);
}

function cleanupFancybox() {
  if (!Fancybox) return;
  fancyboxSelectors.forEach((selector) => {
    Fancybox.unbind(selector);
  });
  fancyboxSelectors = [];
}

const setup = () => {
  window.swup.hooks.on("link:click", () => {
    document.documentElement.style.setProperty("--content-delay", "0ms");
    handleNavbarLinkClick(document.documentElement.scrollTop, bannerEnabled);
  });

  window.swup.hooks.on("content:replace", () => {
    scheduleIdleTask(() => {
      void initFancybox();
    });
    checkKatex();
    initCustomScrollbar();
    initializeArticleToc();
    removePostPageActionButtons();

    refreshDesktopRuntimeState();
    syncDesktopViewportState();
  });

  window.swup.hooks.on("visit:start", (visit: { to: { url: string } }) => {
    cleanupFancybox();
    cleanupBannerRuntime();

    const bodyElement = document.querySelector("body");
    const isHomePage = pathsEqual(visit.to.url, url("/"));
    if (bodyElement) {
      if (isHomePage) {
        bodyElement.classList.add("is-home");
      } else {
        bodyElement.classList.remove("is-home");
      }
    }

    const bannerTextOverlay = document.querySelector(".banner-text-overlay");
    if (bannerTextOverlay) {
      if (isHomePage) {
        bannerTextOverlay.classList.remove("hidden");
      } else {
        bannerTextOverlay.classList.add("hidden");
      }
    }

    syncNavbarHomeState(isHomePage);
    refreshDesktopRuntimeState();

    const heightExtend = document.getElementById("page-height-extend");
    if (heightExtend) {
      heightExtend.classList.remove("hidden");
    }

    markTocNotReady();
  });

  window.swup.hooks.on("page:view", () => {
    const heightExtend = document.getElementById("page-height-extend");
    if (heightExtend) {
      heightExtend.classList.remove("hidden");
    }

    window.scrollTo({
      top: 0,
      behavior: "instant",
    });

    const storedTheme = localStorage.getItem("theme") || DEFAULT_THEME;
    const isDark = storedTheme === DARK_MODE;
    const expectedTheme = isDark ? "github-dark" : "github-light";

    const currentTheme = document.documentElement.getAttribute("data-theme");
    const hasDarkClass = document.documentElement.classList.contains("dark");

    if (currentTheme !== expectedTheme || hasDarkClass !== isDark) {
      requestAnimationFrame(() => {
        if (currentTheme !== expectedTheme) {
          document.documentElement.setAttribute("data-theme", expectedTheme);
        }
        if (hasDarkClass !== isDark) {
          if (isDark) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
      });
    }

    revealBanner();
    removePostPageActionButtons();
    refreshDesktopRuntimeState();
    syncDesktopViewportState();
  });

  window.swup.hooks.on("visit:end", (_visit: { to: { url: string } }) => {
    setTimeout(() => {
      const heightExtend = document.getElementById("page-height-extend");
      if (heightExtend) {
        heightExtend.classList.add("hidden");
      }

      clearTocNotReady();
    }, 200);
  });
};

if (window?.swup?.hooks) {
  scheduleIdleTask(() => {
    void initFancybox();
  });
  checkKatex();
  setup();
} else {
  document.addEventListener("swup:enable", setup);
  runOnDocumentReady(() => {
    scheduleIdleTask(() => {
      void initFancybox();
    });
    checkKatex();
  });
}

function refreshDesktopRuntimeState() {
  refreshNavbarTransparency();
}

function throttle(func: Function, limit: number) {
  let inThrottle: boolean;
  return function (this: any) {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

function syncDesktopViewportState() {
  const scrollTop = document.documentElement.scrollTop;
  const bannerHeight = window.innerHeight * (BANNER_HEIGHT / 100);

  requestAnimationFrame(() => {
    syncDesktopTocVisibility(scrollTop, bannerHeight, bannerEnabled);
    syncNavbarVisibility(scrollTop, bannerEnabled);
  });
}

const throttledScrollFunction = throttle(syncDesktopViewportState, 16);
window.addEventListener("scroll", throttledScrollFunction, {
  passive: true,
});

function handleResize() {
  syncBannerHeightExtend();
  syncDesktopViewportState();
}

window.addEventListener("resize", handleResize);
handleResize();
syncDesktopViewportState();

runOnDocumentReady(async () => {
  revealBanner();
  removePostPageActionButtons();
  refreshDesktopRuntimeState();
  await initializePanelManager();
});
