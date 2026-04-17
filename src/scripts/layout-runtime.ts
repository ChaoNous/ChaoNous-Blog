import { applyLayout, syncDesktopLayoutState } from "./main-grid-runtime";
import { revealBanner, syncBannerHeightExtend } from "./layout-runtime/banner-runtime";
import { initCustomScrollbar } from "./layout-runtime/katex-scrollbar";
import { initFancybox, checkKatex } from "./layout-runtime/fancybox-runtime";
import { removePostPageActionButtons } from "./layout-runtime/post-page-cleanup";
import { initializeArticleToc } from "./layout-runtime/toc-runtime";
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

void initializePanelManager();

function handleResize() {
  syncBannerHeightExtend();
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
  revealBanner();
  applyLayout();
  removePostPageActionButtons();
  syncDesktopLayoutState();
  await initializePanelManager();
});
