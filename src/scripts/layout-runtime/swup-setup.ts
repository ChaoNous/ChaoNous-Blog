import { pathsEqual, url } from "../../utils/url-utils";
import {
  DARK_MODE,
  DEFAULT_THEME,
  TOC_CLEAR_DELAY_MS,
} from "../../constants/constants";
import {
  cleanupBannerRuntime,
  revealBanner,
  syncBannerHeightExtend,
} from "./banner-runtime";
import {
  syncDesktopLayoutState,
  applyLayout,
} from "../main-grid-runtime";
import {
  handleNavbarLinkClick,
  refreshNavbarTransparency,
  syncNavbarHomeState,
} from "./navbar-runtime";
import {
  clearTocNotReady,
  initializeArticleToc,
  markTocNotReady,
} from "./toc-runtime";
import { initFancybox, cleanupFancybox, checkKatex } from "./fancybox-runtime";
import { initCustomScrollbar } from "./katex-scrollbar";
import { removePostPageActionButtons } from "./post-page-cleanup";

function scheduleIdleTask(task: () => void, timeout = 3000): void {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(task);
    return;
  }
  globalThis.setTimeout(task, timeout);
}

function syncDesktopViewportState(): void {
  // Banner removed — no longer need scroll detection
  requestAnimationFrame(() => {
    // Banner removed — no longer sync TOC/navbar visibility
  });
}

function refreshDesktopRuntimeState(): void {
  refreshNavbarTransparency();
}

export function setup(): void {
  window.swup.hooks.on("link:click", () => {
    document.documentElement.style.setProperty("--content-delay", "0ms");
    handleNavbarLinkClick(document.documentElement.scrollTop);
  });

  window.swup.hooks.on("content:replace", () => {
    scheduleIdleTask(() => {
      void initFancybox();
    });
    checkKatex();
    initCustomScrollbar();
    initializeArticleToc();
    removePostPageActionButtons();

    syncDesktopLayoutState();
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
    applyLayout();
    removePostPageActionButtons();
    syncDesktopLayoutState();
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
    }, TOC_CLEAR_DELAY_MS);
  });
}

export {
  revealBanner,
  applyLayout,
  syncDesktopLayoutState,
  removePostPageActionButtons,
  scheduleIdleTask,
  refreshDesktopRuntimeState,
  syncDesktopViewportState,
  syncBannerHeightExtend,
};
