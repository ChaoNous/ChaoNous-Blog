export function initializeArticleToc(): void {
    const tocWrapper = document.getElementById("toc-wrapper");
    if (!tocWrapper)
        return;
    const tocElement = document.querySelector("table-of-contents");
    if (tocElement && typeof (tocElement as any).init === "function") {
        window.setTimeout(() => {
            (tocElement as any).init();
        }, 100);
    }
}
export function markTocNotReady(): void {
    const toc = document.getElementById("toc-wrapper");
    if (toc) {
        toc.classList.add("toc-not-ready");
    }
}
export function clearTocNotReady(): void {
    const toc = document.getElementById("toc-wrapper");
    if (toc) {
        toc.classList.remove("toc-not-ready");
    }
}
export function syncDesktopTocVisibility(_scrollTop: number, _bannerHeight: number, _bannerEnabled: boolean): void {
    const toc = document.getElementById("toc-wrapper");
    if (toc) {
        toc.classList.remove("toc-hide");
    }
}
