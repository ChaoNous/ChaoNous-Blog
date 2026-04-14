import type { Fancybox as FancyboxType } from "@fancyapps/ui";
let fancyboxSelectors: string[] = [];
let Fancybox: typeof FancyboxType | null = null;
let fancyboxStylesLoaded = false;
type FancyboxBind = (selector: string, options?: unknown) => void;
type FancyboxUnbind = (selector: string) => void;
export function checkKatex(): void {
    if (document.querySelector(".katex")) {
        void import("katex/dist/katex.css");
    }
}
export async function initFancybox(): Promise<void> {
    const albumImagesSelector = ".custom-md img, #post-cover img, .moment-images img";
    const albumLinksSelector = ".moment-images a[data-fancybox]";
    const singleFancyboxSelector = "[data-fancybox]:not(.moment-images a)";
    const hasImages = document.querySelector(albumImagesSelector) ||
        document.querySelector(albumLinksSelector) ||
        document.querySelector(singleFancyboxSelector);
    if (!hasImages)
        return;
    if (!Fancybox) {
        const mod = await import("@fancyapps/ui");
        Fancybox = mod.Fancybox;
        void import("@fancyapps/ui/dist/fancybox/fancybox.css");
    }
    if (!fancyboxStylesLoaded) {
        void import("../../styles/fancybox-custom.css");
        fancyboxStylesLoaded = true;
    }
    const fancybox = Fancybox;
    if (!fancybox || fancyboxSelectors.length > 0)
        return;
    const bindFancybox = fancybox.bind as unknown as FancyboxBind;
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
    bindFancybox(albumImagesSelector, {
        ...commonConfig,
        groupAll: true,
        Carousel: {
            transition: "slide",
            preload: 2,
        },
    });
    fancyboxSelectors.push(albumImagesSelector);
    bindFancybox(albumLinksSelector, {
        ...commonConfig,
        source: (el: HTMLElement) => {
            return el.getAttribute("data-src") || el.getAttribute("href");
        },
    });
    fancyboxSelectors.push(albumLinksSelector);
    bindFancybox(singleFancyboxSelector, commonConfig);
    fancyboxSelectors.push(singleFancyboxSelector);
}
export function cleanupFancybox(): void {
    const fancybox = Fancybox;
    if (!fancybox)
        return;
    const unbindFancybox = fancybox.unbind as unknown as FancyboxUnbind;
    fancyboxSelectors.forEach((selector) => {
        unbindFancybox(selector);
    });
    fancyboxSelectors = [];
}
