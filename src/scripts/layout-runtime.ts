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
  applyLayout();
  syncDesktopLayoutState();
  await initializePanelManager();
});
