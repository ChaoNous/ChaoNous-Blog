import "./view-transitions.js";
import { pathsEqual, url } from "../utils/url-utils";
import { DARK_MODE, DEFAULT_THEME } from "../constants/constants";
import { siteConfig, widgetConfigs } from "../config";
import { initSakura } from "../utils/sakura-manager";

const BANNER_HEIGHT = 35;
const BANNER_HEIGHT_EXTEND = 30;
const BANNER_HEIGHT_HOME = BANNER_HEIGHT + BANNER_HEIGHT_EXTEND;
const bannerEnabled = !!document.getElementById("banner-wrapper");
const IDLE_FALLBACK_DELAY = 100;

let panelManagerInitialization: Promise<unknown> | null = null;

function scheduleIdleTask(task: () => void, timeout = IDLE_FALLBACK_DELAY) {
	if ("requestIdleCallback" in window) {
		window.requestIdleCallback(task);
		return;
	}

	window.setTimeout(task, timeout);
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
							if (
								ignoreElement === target ||
								ignoreElement?.contains(target)
							) {
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
				setClickOutsideToClose("mobile-toc-panel", [
					"mobile-toc-panel",
					"mobile-toc-switch",
				]);
				setClickOutsideToClose("wallpaper-mode-panel", [
					"wallpaper-mode-panel",
					"wallpaper-mode-switch",
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

function showBanner() {
	requestAnimationFrame(() => {
		const banner = document.getElementById("banner");
		if (banner) {
			banner.classList.remove("opacity-0", "scale-105");
		}

		const mobileBanner = document.querySelector(
			'.block.md\\:hidden[alt="Mobile banner image of the blog"]',
		);
		if (mobileBanner && !document.getElementById("banner-carousel")) {
			mobileBanner.classList.remove("opacity-0", "scale-105");
			mobileBanner.classList.add("opacity-100");
		}

		const carousel = document.getElementById("banner-carousel");
		if (carousel) {
			initCarousel();
		}
	});
}

function initCarousel() {
	const carouselItems = document.querySelectorAll(".carousel-item");
	const isMobile = window.innerWidth < 768;
	const validItems = Array.from(carouselItems).filter((item) => {
		if (isMobile) {
			return item.querySelector(".block.md\\:hidden");
		}
		return item.querySelector(".hidden.md\\:block");
	});

	if (validItems.length > 1 && siteConfig.banner.carousel?.enable) {
		let currentIndex = 0;
		const interval = siteConfig.banner.carousel?.interval || 6;
		let carouselInterval: any;
		let isPaused = false;
		let startX = 0;
		let startY = 0;
		let isSwiping = false;

		const carousel = document.getElementById("banner-carousel");

		function switchToSlide(index: number) {
			const currentItem = validItems[currentIndex];
			currentItem.classList.remove("opacity-100", "scale-100");
			currentItem.classList.add("opacity-0", "scale-110");

			currentIndex = index;

			const nextItem = validItems[currentIndex];
			nextItem.classList.add("opacity-100", "scale-100");
			nextItem.classList.remove("opacity-0", "scale-110");
		}

		carouselItems.forEach((item) => {
			item.classList.add("opacity-0", "scale-110");
			item.classList.remove("opacity-100", "scale-100");
		});

		if (validItems.length > 0) {
			validItems[0].classList.add("opacity-100", "scale-100");
			validItems[0].classList.remove("opacity-0", "scale-110");
		}

		if (carousel && "ontouchstart" in window) {
			carousel.addEventListener(
				"touchstart",
				(e) => {
					startX = e.touches[0].clientX;
					startY = e.touches[0].clientY;
					isSwiping = false;
					isPaused = true;
					clearInterval(carouselInterval);
				},
				{ passive: true },
			);

			carousel.addEventListener(
				"touchmove",
				(e) => {
					if (!startX || !startY) return;

					const diffX = Math.abs(e.touches[0].clientX - startX);
					const diffY = Math.abs(e.touches[0].clientY - startY);

					if (diffX > diffY && diffX > 30) {
						isSwiping = true;
						e.preventDefault();
					}
				},
				{ passive: false },
			);

			carousel.addEventListener(
				"touchend",
				(e) => {
					if (!startX || !startY || !isSwiping) {
						isPaused = false;
						startCarousel();
						return;
					}

					const endX = e.changedTouches[0].clientX;
					const diffX = startX - endX;

					if (Math.abs(diffX) > 50) {
						if (diffX > 0) {
							const nextIndex = (currentIndex + 1) % validItems.length;
							switchToSlide(nextIndex);
						} else {
							const prevIndex =
								(currentIndex - 1 + validItems.length) % validItems.length;
							switchToSlide(prevIndex);
						}
					}

					startX = 0;
					startY = 0;
					isSwiping = false;
					isPaused = false;
					startCarousel();
				},
				{ passive: true },
			);
		}

		function startCarousel() {
			clearInterval(carouselInterval);
			carouselInterval = setInterval(() => {
				if (!isPaused) {
					const nextIndex = (currentIndex + 1) % validItems.length;
					switchToSlide(nextIndex);
				}
			}, interval * 1000);
		}

		if (carousel) {
			carousel.addEventListener("mouseenter", () => {
				isPaused = true;
				clearInterval(carouselInterval);
			});
			carousel.addEventListener("mouseleave", () => {
				isPaused = false;
				startCarousel();
			});
		}

		startCarousel();
	}
}

function setupSakura() {
	const sakuraConfig = (widgetConfigs as any)?.sakura;
	if (!sakuraConfig || !sakuraConfig.enable) return;
	if ((window as any).sakuraInitialized) return;
	initSakura(sakuraConfig);
	(window as any).sakuraInitialized = true;
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", setupSakura);
} else {
	setupSakura();
}

let fancyboxSelectors: string[] = [];
let Fancybox: any;

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

		if (bannerEnabled) {
			const navbar = document.getElementById("navbar-wrapper");
			if (navbar && document.body.classList.contains("is-home")) {
				const threshold = window.innerHeight * (BANNER_HEIGHT / 100) - 88;
				if (document.documentElement.scrollTop >= threshold) {
					navbar.classList.add("navbar-hidden");
				}
			}
		}
	});

	window.swup.hooks.on("content:replace", () => {
		requestIdleCallback(() => initFancybox());
		checkKatex();
		initCustomScrollbar();

		const tocWrapper = document.getElementById("toc-wrapper");
		const isArticlePage = tocWrapper !== null;

		if (isArticlePage) {
			const tocElement = document.querySelector("table-of-contents");
			if (tocElement && typeof (tocElement as any).init === "function") {
				setTimeout(() => {
					(tocElement as any).init();
				}, 100);
			}

			if (typeof window.mobileTOCInit === "function") {
				setTimeout(() => {
					window.mobileTOCInit!();
				}, 100);
			}
		}

		refreshDesktopRuntimeState();
		scrollFunction();
	});

	window.swup.hooks.on("visit:start", (visit: { to: { url: string } }) => {
		cleanupFancybox();

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

		const navbar = document.getElementById("navbar");
		if (navbar) {
			navbar.setAttribute("data-is-home", isHomePage.toString());
			const transparentMode = navbar.getAttribute("data-transparent-mode");
			if (
				transparentMode === "semifull" &&
				typeof window.initSemifullScrollDetection === "function"
			) {
				window.initSemifullScrollDetection();
			}
		}

		const heightExtend = document.getElementById("page-height-extend");
		if (heightExtend) {
			heightExtend.classList.remove("hidden");
		}

		const toc = document.getElementById("toc-wrapper");
		if (toc) {
			toc.classList.add("toc-not-ready");
		}
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

		refreshDesktopRuntimeState();
		scrollFunction();
	});

	window.swup.hooks.on("visit:end", (_visit: { to: { url: string } }) => {
		setTimeout(() => {
			const heightExtend = document.getElementById("page-height-extend");
			if (heightExtend) {
				heightExtend.classList.add("hidden");
			}

			const toc = document.getElementById("toc-wrapper");
			if (toc) {
				toc.classList.remove("toc-not-ready");
			}
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

function getRuntimeElements() {
	return {
		backToTopBtn: document.getElementById("back-to-top-btn"),
		toc: document.getElementById("toc-wrapper"),
		navbarWrapper: document.getElementById("navbar-wrapper"),
		navbar: document.getElementById("navbar"),
	};
}

function refreshDesktopRuntimeState() {
	const { navbar } = getRuntimeElements();
	if (!navbar) return;

	const transparentMode = navbar.getAttribute("data-transparent-mode");
	if (
		transparentMode === "semifull" &&
		typeof window.initSemifullScrollDetection === "function"
	) {
		window.initSemifullScrollDetection();
	}
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

function scrollFunction() {
	const scrollTop = document.documentElement.scrollTop;
	const bannerHeight = window.innerHeight * (BANNER_HEIGHT / 100);
	const { backToTopBtn, toc, navbarWrapper } = getRuntimeElements();

	const contentWrapper = document.getElementById("content-wrapper");
	let showBackToTopThreshold = bannerHeight + 100;

	if (contentWrapper) {
		const rect = contentWrapper.getBoundingClientRect();
		const absoluteTop = rect.top + scrollTop;
		showBackToTopThreshold = absoluteTop + window.innerHeight / 4;
	}

	requestAnimationFrame(() => {
		if (backToTopBtn) {
			if (scrollTop > showBackToTopThreshold) {
				backToTopBtn.classList.remove("hide");
			} else {
				backToTopBtn.classList.add("hide");
			}
		}

		if (bannerEnabled && toc) {
			const isBannerMode = document.body.classList.contains("enable-banner");
			if (isBannerMode) {
				if (scrollTop > bannerHeight) {
					toc.classList.remove("toc-hide");
				} else {
					toc.classList.add("toc-hide");
				}
			} else {
				toc.classList.remove("toc-hide");
			}
		}

		if (bannerEnabled && navbarWrapper) {
			const isHome =
				document.body.classList.contains("is-home") &&
				window.innerWidth >= 1280;
			const currentBannerHeight = isHome ? BANNER_HEIGHT_HOME : BANNER_HEIGHT;
			const threshold =
				window.innerHeight * (currentBannerHeight / 100) - 88;
			if (scrollTop >= threshold) {
				navbarWrapper.classList.add("navbar-hidden");
			} else {
				navbarWrapper.classList.remove("navbar-hidden");
			}
		}
	});
}

const throttledScrollFunction = throttle(scrollFunction, 16);
window.addEventListener("scroll", throttledScrollFunction, {
	passive: true,
});

function handleResize() {
	let offset = Math.floor(window.innerHeight * (BANNER_HEIGHT_EXTEND / 100));
	offset = offset - (offset % 4);
	document.documentElement.style.setProperty(
		"--banner-height-extend",
		`${offset}px`,
	);
	scrollFunction();
}

window.addEventListener("resize", handleResize);
handleResize();
scrollFunction();

runOnDocumentReady(async () => {
	showBanner();
	refreshDesktopRuntimeState();
	await initializePanelManager();
});
