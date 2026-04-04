/**
 * Layout runtime entry point.
 * Thin orchestrator — imports sub-modules, registers Swup hooks,
 * wires up global scroll/resize handlers.
 */

import { SCROLL_THROTTLE_MS } from "../constants/constants";
import {
  revealBanner,
  applyLayout,
  syncDesktopLayoutState,
  syncBannerHeightExtend,
  removePostPageActionButtons,
  scheduleIdleTask,
  setup,
  refreshDesktopRuntimeState,
  syncDesktopViewportState,
} from "./layout-runtime/swup-setup";
import { initCustomScrollbar } from "./layout-runtime/katex-scrollbar";
import { initFancybox, checkKatex } from "./layout-runtime/fancybox-runtime";
import { initializePanelManager } from "./panel-init";

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

// ── One-time initialization ──
void initializePanelManager();
scheduleIdleTask(initCustomScrollbar);

// ── Swup hooks ──
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

// ── Global viewport handlers ──
function throttle(
  func: (...args: unknown[]) => void,
  limit: number,
): (...args: unknown[]) => void {
  let inThrottle: boolean;
  return function (this: unknown) {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, [...args]);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

const throttledScrollFunction = throttle(
  syncDesktopViewportState,
  SCROLL_THROTTLE_MS,
);
window.addEventListener("scroll", throttledScrollFunction, {
  passive: true,
});

function handleResize() {
  syncBannerHeightExtend();
  applyLayout();
  syncDesktopLayoutState();
  syncDesktopViewportState();
}

window.addEventListener("resize", handleResize);
handleResize();
syncDesktopViewportState();

// ── Initial page load ──
runOnDocumentReady(async () => {
  revealBanner();
  applyLayout();
  removePostPageActionButtons();
  syncDesktopLayoutState();
  refreshDesktopRuntimeState();
  await initializePanelManager();
});
