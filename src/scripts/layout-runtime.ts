import {
  revealBanner,
  applyLayout,
  syncDesktopLayoutState,
  syncBannerHeightExtend,
  removePostPageActionButtons,
  scheduleIdleTask,
  setup,
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
void initializePanelManager();
scheduleIdleTask(initCustomScrollbar);
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
function handleResize() {
  syncBannerHeightExtend();
  applyLayout();
  syncDesktopLayoutState();
}
window.addEventListener("resize", handleResize);
handleResize();
runOnDocumentReady(async () => {
  revealBanner();
  applyLayout();
  removePostPageActionButtons();
  syncDesktopLayoutState();
  await initializePanelManager();
});
