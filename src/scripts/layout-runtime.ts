import { applyLayout, syncDesktopLayoutState } from "./main-grid-runtime";
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

function scheduleIdleTask(task: () => void, timeout = 3000): void {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(task);
    return;
  }

  globalThis.setTimeout(task, timeout);
}

function initializeArticleToc(): void {
  const tocWrapper = document.getElementById("toc-wrapper");
  if (!tocWrapper) return;

  const tocElement = document.querySelector("table-of-contents") as
    | { init?: () => void }
    | null;
  if (typeof tocElement?.init !== "function") return;

  window.setTimeout(() => {
    tocElement.init?.();
  }, 100);
}

function removePostPageActionButtons(): void {
  if (document.querySelector('#main-content[data-is-post-page="true"]') === null) {
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

void initializePanelManager();

function handleResize() {
  applyLayout();
  syncDesktopLayoutState();
}
window.addEventListener("resize", handleResize);
handleResize();
runOnDocumentReady(async () => {
  scheduleIdleTask(() => {
    void initFancybox();
  });
  scheduleIdleTask(initCustomScrollbar);
  checkKatex();
  initializeArticleToc();
  applyLayout();
  removePostPageActionButtons();
  syncDesktopLayoutState();
  await initializePanelManager();
});
