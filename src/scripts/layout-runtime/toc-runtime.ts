export function initializeArticleToc() {
  const tocWrapper = document.getElementById("toc-wrapper");
  if (!tocWrapper) return;

  const tocElement = document.querySelector("table-of-contents");
  if (tocElement && typeof (tocElement as any).init === "function") {
    window.setTimeout(() => {
      (tocElement as any).init();
    }, 100);
  }
}

export function markTocNotReady() {
  const toc = document.getElementById("toc-wrapper");
  if (toc) {
    toc.classList.add("toc-not-ready");
  }
}

export function clearTocNotReady() {
  const toc = document.getElementById("toc-wrapper");
  if (toc) {
    toc.classList.remove("toc-not-ready");
  }
}

export function syncDesktopTocVisibility(
  scrollTop: number,
  bannerHeight: number,
  bannerEnabled: boolean,
) {
  if (!bannerEnabled) return;

  const toc = document.getElementById("toc-wrapper");
  if (!toc) return;

  const isBannerMode = document.body.classList.contains("enable-banner");
  if (isBannerMode) {
    if (scrollTop > bannerHeight) {
      toc.classList.remove("toc-hide");
    } else {
      toc.classList.add("toc-hide");
    }
    return;
  }

  toc.classList.remove("toc-hide");
}
