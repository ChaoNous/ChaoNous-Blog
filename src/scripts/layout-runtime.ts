	// 使用原生 View Transitions API 替代 Swup，更轻量高效
	import "./view-transitions.js";
	import { pathsEqual, url } from "../utils/url-utils";
	import { DARK_MODE, DEFAULT_THEME } from "../constants/constants";

	const BANNER_HEIGHT = 35;
	const BANNER_HEIGHT_EXTEND = 30;
	const BANNER_HEIGHT_HOME = BANNER_HEIGHT + BANNER_HEIGHT_EXTEND;

	// const MAIN_PANEL_OVERLAPS_BANNER_HEIGHT = 3.5;
	import { siteConfig } from "../config";
	import { widgetConfigs } from "../config";
	import { initSakura } from "../utils/sakura-manager";

	const bannerEnabled = !!document.getElementById("banner-wrapper");

	// 导入面板管理器
	async function initializePanelManager() {
		try {
			const { panelManager } = await import("../utils/panel-manager");

			function setClickOutsideToClose(panel: string, ignores: string[]) {
				document.addEventListener("click", async (event) => {
					let tDom = event.target;
					if (!(tDom instanceof Node)) return; // Ensure the event target is an HTML Node
					for (let ig of ignores) {
						let ie = document.getElementById(ig);
						if (ie == tDom || ie?.contains(tDom)) {
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
	}

	initializePanelManager();

	// 寤惰繜闈炲叧閿姛鑳藉埌绌洪棽鏃?
	if ('requestIdleCallback' in window) {
		requestIdleCallback(() => {
			initCustomScrollbar();
		});
	} else {
		setTimeout(initCustomScrollbar, 100);
	}

	function initCustomScrollbar() {
		// 瀹屽叏绂佺敤OverlayScrollbars鐨刡ody鍒濆鍖栵紝閬垮厤瀵艰嚧椤甸潰閲嶆柊鍔犺浇
		// 鍙鐞唊atex鍏冪礌鐨勬粴鍔ㄦ潯
		const katexElements = document.querySelectorAll(
			".katex-display:not([data-scrollbar-initialized])",
		) as NodeListOf<HTMLElement>;

		katexElements.forEach((element) => {
			if (!element.parentNode) return;

			const container = document.createElement("div");
			container.className = "katex-display-container";
			element.parentNode.insertBefore(container, element);
			container.appendChild(element);

			// 浣跨敤绠€鍗曠殑CSS婊氬姩鏉¤€屼笉鏄疧verlayScrollbars
			container.style.cssText = `
            overflow-x: auto;
            scrollbar-width: thin;
            scrollbar-color: rgba(0,0,0,0.3) transparent;
        `;

			// 涓簑ebkit娴忚鍣ㄦ坊鍔犺嚜瀹氫箟婊氬姩鏉℃牱锟?
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
		// 浣跨敤requestAnimationFrame浼樺寲DOM鎿嶄綔
		requestAnimationFrame(() => {
			// Handle single image banner (desktop)
			const banner = document.getElementById("banner");
			if (banner) {
				banner.classList.remove("opacity-0", "scale-105");
			}

			// Handle mobile single image banner - 浣跨敤涓庣數鑴戠鐩稿悓鐨勯€昏緫
			const mobileBanner = document.querySelector(
				'.block.md\\:hidden[alt="Mobile banner image of the blog"]',
			);
			if (mobileBanner && !document.getElementById("banner-carousel")) {
				// 绉诲姩绔娇鐢ㄤ笌鐢佃剳绔浉鍚岀殑鍒濆鍖栭€昏緫
				mobileBanner.classList.remove("opacity-0", "scale-105");
				mobileBanner.classList.add("opacity-100");
			}

			// Handle carousel banner - 绔嬪嵆鍒濆鍖栵紝绉婚櫎寤惰繜
			const carousel = document.getElementById("banner-carousel");
			if (carousel) {
				// 绔嬪嵆鍒濆鍖栬疆鎾紝绉婚櫎寤惰繜浠ユ敼鍠勬祦鐣咃拷?
				initCarousel();
			}
		});
	}

	function initCarousel() {
		const carouselItems = document.querySelectorAll(".carousel-item");
		// 鏍规嵁灞忓箷灏哄杩囨护鏈夋晥鐨勮疆鎾」
		const isMobile = window.innerWidth < 768; // md breakpoint
		const validItems = Array.from(carouselItems).filter((item) => {
			if (isMobile) {
				// 绉诲姩绔細鍙樉绀烘湁mobile鍥剧墖鐨勯」锟?
				return item.querySelector(".block.md\\:hidden");
			} else {
				// 妗岄潰锟?骞虫澘绔細鍙樉绀烘湁desktop鍥剧墖鐨勯」锟?
				return item.querySelector(".hidden.md\\:block");
			}
		});

		if (validItems.length > 1 && siteConfig.banner.carousel?.enable) {
			let currentIndex = 0;
			const interval = siteConfig.banner.carousel?.interval || 6;
			let carouselInterval: any;
			let isPaused = false;

			// 绉诲姩绔Е鎽告墜鍔挎敮锟?
			let startX = 0;
			let startY = 0;
			let isSwiping = false;

			const carousel = document.getElementById("banner-carousel");

			// 鍒囨崲鍥剧墖鐨勫嚱锟?- 鍩轰簬鏈夋晥椤圭洰
			function switchToSlide(index: number) {
				// 闅愯棌褰撳墠鍥剧墖
				const currentItem = validItems[currentIndex];
				currentItem.classList.remove("opacity-100", "scale-100");
				currentItem.classList.add("opacity-0", "scale-110");

				// 鏇存柊绱㈠紩
				currentIndex = index;

				// 鏄剧ず鏂板浘锟?
				const nextItem = validItems[currentIndex];
				nextItem.classList.add("opacity-100", "scale-100");
				nextItem.classList.remove("opacity-0", "scale-110");
			}

			// 鍒濆鍖栵細闅愯棌鎵€鏈夊浘鐗囷紝鍙樉绀虹涓€寮犳湁鏁堝浘锟?
			carouselItems.forEach((item) => {
				item.classList.add("opacity-0", "scale-110");
				item.classList.remove("opacity-100", "scale-100");
			});

			// 鏄剧ず绗竴寮犳湁鏁堝浘锟?
			if (validItems.length > 0) {
				validItems[0].classList.add("opacity-100", "scale-100");
				validItems[0].classList.remove("opacity-0", "scale-110");
			}

			// 绉诲姩绔Е鎽镐簨锟?
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

						// 鍒ゆ柇鏄惁涓烘按骞虫粦锟?
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

						// 婊戝姩璺濈瓒呰繃50px鎵嶅垏锟?
						if (Math.abs(diffX) > 50) {
							if (diffX > 0) {
								// 鍚戝乏婊戝姩锛屾樉绀轰笅涓€锟?
								const nextIndex =
									(currentIndex + 1) % validItems.length;
								switchToSlide(nextIndex);
							} else {
								// 鍚戝彸婊戝姩锛屾樉绀轰笂涓€锟?
								const prevIndex =
									(currentIndex - 1 + validItems.length) %
									validItems.length;
								switchToSlide(prevIndex);
							}
						}

						startX = 0;
						startY = 0;
						isSwiping = false;
						isPaused = false;
						// 閲嶆柊寮€濮嬭嚜鍔ㄨ疆锟?
						startCarousel();
					},
					{ passive: true },
				);
			}

			// 寮€濮嬭疆鎾殑鍑芥暟
			function startCarousel() {
				clearInterval(carouselInterval);
				carouselInterval = setInterval(() => {
					if (!isPaused) {
						const nextIndex =
							(currentIndex + 1) % validItems.length;
						switchToSlide(nextIndex);
					}
				}, interval * 1000);
			}

			// 榧犳爣鎮仠鏆傚仠锛堟闈㈢锟?
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

			// 寮€濮嬭嚜鍔ㄨ疆锟?
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

	// 鏁板鍏紡鎸夐渶鍔犺浇
	function checkKatex() {
		if (document.querySelector(".katex")) {
			import("katex/dist/katex.css");
		}
	}

	// 鍥剧墖鐏鎸夐渶寤惰繜鍔犺浇
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
			return; // 宸茬粡鍒濆鍖栵紝鐩存帴杩斿洖
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

		// 缁戝畾鐩稿唽/鏂囩珷鍥剧墖
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

		// 缁戝畾鍗曠嫭锟?fancybox 鍥剧墖
		Fancybox.bind(singleFancyboxSelector, commonConfig);
		fancyboxSelectors.push(singleFancyboxSelector);
	}

	// 娓呯悊 Fancybox 瀹炰緥
	function cleanupFancybox() {
		if (!Fancybox) return; // 濡傛灉浠庢湭鍔犺浇杩囷紝鏃犻渶娓呯悊
		fancyboxSelectors.forEach((selector) => {
			Fancybox.unbind(selector);
		});
		fancyboxSelectors = [];
	}

	const setup = () => {
		window.swup.hooks.on("link:click", () => {
			// Remove the delay for the first time page load
			document.documentElement.style.setProperty(
				"--content-delay",
				"0ms",
			);

			// 绠€鍖杗avbar澶勭悊閫昏緫
			if (bannerEnabled) {
				const navbar = document.getElementById("navbar-wrapper");
				if (navbar && document.body.classList.contains("is-home")) {
					const threshold =
						window.innerHeight * (BANNER_HEIGHT / 100) - 88;
					if (document.documentElement.scrollTop >= threshold) {
						navbar.classList.add("navbar-hidden");
					}
				}
			}
		});

		window.swup.hooks.on("content:replace", () => {
			// 鍒濆鍖栨柊椤甸潰鐨勫浘鐗囥€佸叕寮忋€佹粴鍔ㄦ潯鍜孴OC
			// 寤惰繜鍒濆鍖?Fancybox锛岄伩鍏嶉樆濉為灞?
			requestIdleCallback(() => initFancybox());
			checkKatex();
			initCustomScrollbar();

			// 妫€鏌ュ綋鍓嶉〉闈㈡槸鍚︿负鏂囩珷椤甸潰锛堟湁TOC鍏冪礌锟?
			const tocWrapper = document.getElementById("toc-wrapper");
			const isArticlePage = tocWrapper !== null;

			// 只在文章页面重新初始化 TOC 组件
			if (isArticlePage) {
				const tocElement = document.querySelector("table-of-contents");
				if (
					tocElement &&
					typeof (tocElement as any).init === "function"
				) {
					setTimeout(() => {
						(tocElement as any).init();
					}, 100);
				}


				// 重新初始化移动端 TOC 组件
				if (typeof window.mobileTOCInit === "function") {
					setTimeout(() => {
						window.mobileTOCInit!();
					}, 100);
				}
			}

			// 重新初始化 semifull 模式的滚动检测
			if (navbar) {
				const transparentMode = navbar.getAttribute(
					"data-transparent-mode",
				);
				if (transparentMode === "semifull") {
					// 重新调用初始化函数来重新绑定滚动事件
					if (typeof window.initSemifullScrollDetection === "function") {
						window.initSemifullScrollDetection();
					}
				}
			}
		});


		window.swup.hooks.on(
			"visit:start",
			(visit: { to: { url: string } }) => {
				// 娓呯悊涓婁竴椤电殑 Fancybox
				cleanupFancybox();

				// 澶勭悊 Banner class 鍜屾樉绀虹姸锟?
				const bodyElement = document.querySelector("body");
				const isHomePage = pathsEqual(visit.to.url, url("/"));
				if (bodyElement) {
					if (isHomePage) {
						bodyElement.classList.add("is-home");
					} else {
						bodyElement.classList.remove("is-home");
					}
				}

				// Control banner text visibility based on page
				const bannerTextOverlay = document.querySelector(
					".banner-text-overlay",
				);
				if (bannerTextOverlay) {
					if (isHomePage) {
						bannerTextOverlay.classList.remove("hidden");
					} else {
						bannerTextOverlay.classList.add("hidden");
					}
				}

				// Control navbar transparency based on page
				const navbar = document.getElementById("navbar");
				if (navbar) {
					navbar.setAttribute("data-is-home", isHomePage.toString());
					// 重新初始化 semifull 模式的滚动检测
					const transparentMode = navbar.getAttribute(
						"data-transparent-mode",
					);
					if (transparentMode === "semifull") {
						// 重新调用初始化函数来重新绑定滚动事件
						if (typeof window.initSemifullScrollDetection === "function") {
							window.initSemifullScrollDetection();
						}
					}
				}

				// increase the page height during page transition to prevent the scrolling animation from jumping
				const heightExtend =
					document.getElementById("page-height-extend");
				if (heightExtend) {
					heightExtend.classList.remove("hidden");
				}

				// Hide the TOC while scrolling back to top
				let toc = document.getElementById("toc-wrapper");
				if (toc) {
					toc.classList.add("toc-not-ready");
				}
			},
		);

		window.swup.hooks.on("page:view", () => {
			// hide the temp high element when the transition is done
			const heightExtend = document.getElementById("page-height-extend");
			if (heightExtend) {
				heightExtend.classList.remove("hidden");
			}

			// 纭繚椤甸潰婊氬姩鍒伴《閮紝鐗瑰埆鏄Щ鍔ㄧbanner鍏抽棴锟?
			window.scrollTo({
				top: 0,
				behavior: "instant",
			});

			// 鍚屾涓婚鐘讹拷?- 瑙ｅ喅浠庨椤佃繘鍏ユ枃绔犻〉闈㈡椂浠ｇ爜鍧楁覆鏌撻棶锟?
			const storedTheme = localStorage.getItem("theme") || DEFAULT_THEME;
			const isDark = storedTheme === DARK_MODE;
			const expectedTheme = isDark ? "github-dark" : "github-light";

			const currentTheme =
				document.documentElement.getAttribute("data-theme");
			const hasDarkClass =
				document.documentElement.classList.contains("dark");

			// 濡傛灉涓婚涓嶅尮閰嶏紝浣跨敤鎵归噺鏇存柊鍑忓皯閲嶇粯
			if (currentTheme !== expectedTheme || hasDarkClass !== isDark) {
				// 浣跨敤 requestAnimationFrame 鎵归噺鏇存柊锛屽噺灏戦噸锟?
				requestAnimationFrame(() => {
					// 鍚屾 data-theme 灞烇拷?
					if (currentTheme !== expectedTheme) {
						document.documentElement.setAttribute(
							"data-theme",
							expectedTheme,
						);
					}
					// 鍚屾 dark class
					if (hasDarkClass !== isDark) {
						if (isDark) {
							document.documentElement.classList.add("dark");
						} else {
							document.documentElement.classList.remove("dark");
						}
					}
				});
			}
		});

		window.swup.hooks.on("visit:end", (_visit: { to: { url: string } }) => {
			setTimeout(() => {
				const heightExtend =
					document.getElementById("page-height-extend");
				if (heightExtend) {
					heightExtend.classList.add("hidden");
				}

				// Just make the transition looks better
				const toc = document.getElementById("toc-wrapper");
				if (toc) {
					toc.classList.remove("toc-not-ready");
				}
			}, 200);
		});
	};

	if (window?.swup?.hooks) {
		requestIdleCallback(() => initFancybox());
		checkKatex();
		setup();
	} else {
		document.addEventListener("swup:enable", setup);
		// 鐩戝惉 DOM 鍔犺浇 (纭繚棣栧睆涔熻兘鍔犺浇浼樺寲缁勪欢)
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", () => {
				requestIdleCallback(() => initFancybox());
				checkKatex();
			});
		} else {
			requestIdleCallback(() => initFancybox());
			checkKatex();
		}
	}

	let backToTopBtn = document.getElementById("back-to-top-btn");
	let toc = document.getElementById("toc-wrapper");
	let navbar = document.getElementById("navbar-wrapper");

	// 鑺傛祦鍑芥暟
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

		// 灏濊瘯鑾峰彇鍐呭鍖哄煙鐨勮捣濮嬩綅锟?
		const contentWrapper = document.getElementById("content-wrapper");
		let showBackToTopThreshold = bannerHeight + 100; // 榛樿鍥為€€锟?

		if (contentWrapper) {
			const rect = contentWrapper.getBoundingClientRect();
			// 锟?content-wrapper 鐨勯《閮ㄦ帴杩戣鍙ｉ《閮ㄦ椂鏄剧ず
			// rect.top 鏄浉瀵逛簬瑙嗗彛鐨勶紝褰撳畠灏忎簬瑙嗗彛楂樺害鐨勪竴鍗婃椂锛岃鏄庡凡缁忔粴鍔ㄥ埌浜嗗唴瀹瑰尯
			// 鎴栬€呮洿绠€鍗曪細scrollTop > contentWrapper.offsetTop
			// 鐢变簬 offsetTop 鏄浉瀵逛簬 offsetParent 鐨勶紝鍙兘闇€瑕佺疮锟?
			// 杩欓噷鎴戜滑浣跨敤 getBoundingClientRect + scrollTop 鏉ヨ幏鍙栫粷瀵逛綅锟?
			const absoluteTop = rect.top + scrollTop;
			// 鍙湁褰撴粴鍔ㄨ秴杩囧唴瀹瑰尯鍩熻捣濮嬩綅缃竴瀹氳窛绂诲悗鎵嶆樉锟?
			showBackToTopThreshold = absoluteTop + window.innerHeight / 4;
		}

		// 鎵归噺澶勭悊DOM鎿嶄綔
		requestAnimationFrame(() => {
			if (backToTopBtn) {
				// 浣跨敤鍔ㄦ€佽绠楃殑闃堬拷?
				if (scrollTop > showBackToTopThreshold) {
					backToTopBtn.classList.remove("hide");
				} else {
					backToTopBtn.classList.add("hide");
				}
			}

			if (bannerEnabled && toc) {
				const isBannerMode =
					document.body.classList.contains("enable-banner");
				if (isBannerMode) {
					if (scrollTop > bannerHeight) {
						toc.classList.remove("toc-hide");
					} else {
						toc.classList.add("toc-hide");
					}
				} else {
					// In Fullscreen or None mode, always show TOC
					toc.classList.remove("toc-hide");
				}
			}

			if (bannerEnabled && navbar) {
				const isHome =
					document.body.classList.contains("is-home") &&
					window.innerWidth >= 1280;
				const currentBannerHeight = isHome
					? BANNER_HEIGHT_HOME
					: BANNER_HEIGHT;

				const threshold =
					window.innerHeight * (currentBannerHeight / 100) - 88;
				if (scrollTop >= threshold) {
					navbar.classList.add("navbar-hidden");
				} else {
					navbar.classList.remove("navbar-hidden");
				}
			}
		});
	}

	// 浣跨敤鑺傛祦浼樺寲婊氬姩鎬ц兘
	window.onscroll = throttle(scrollFunction, 16); // 锟?0fps

	window.onresize = () => {
		// calculate the --banner-height-extend, which needs to be a multiple of 4 to avoid blurry text
		let offset = Math.floor(
			window.innerHeight * (BANNER_HEIGHT_EXTEND / 100),
		);
		offset = offset - (offset % 4);
		document.documentElement.style.setProperty(
			"--banner-height-extend",
			`${offset}px`,
		);
	};

	// 椤甸潰鍔犺浇瀹屾垚鍚庡垵濮嬪寲banner鍜岃疆鎾浘
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", async () => {
			showBanner();
			// 鍒濆鍖栭潰鏉跨鐞嗗櫒
			try {
				await import("../utils/panel-manager.js");
			} catch (error) {
				console.error("Failed to initialize panel manager:", error);
			}
		});
	} else {
		showBanner();
		// 椤甸潰宸茬粡鍔犺浇瀹屾垚锛岀珛鍗冲垵濮嬪寲闈㈡澘绠＄悊锟?
		(async () => {
			try {
				await import("../utils/panel-manager.js");
			} catch (error) {
				console.error("Failed to initialize panel manager:", error);
			}
		})();
	}
