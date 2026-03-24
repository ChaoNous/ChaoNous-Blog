const runtimeConfig = window.__mainGridRuntimeConfig || {};
const navbarTransparentMode = runtimeConfig.navbarTransparentMode || "semi";
const defaultWallpaperMode = runtimeConfig.defaultWallpaperMode || "banner";
const BANNER_HEIGHT = runtimeConfig.BANNER_HEIGHT || 35;

		(function () {
			const wallpaperMode =
				localStorage.getItem("wallpaperMode") || defaultWallpaperMode;
			const body = document.body;

			// const BANNER_HEIGHT = 35;
			// const BANNER_HEIGHT_EXTEND = 30;
			// const BANNER_HEIGHT_HOME = BANNER_HEIGHT + BANNER_HEIGHT_EXTEND;
			// const MAIN_PANEL_OVERLAPS_BANNER_HEIGHT = 3.5;

			switch (wallpaperMode) {
				case "banner":
					body.classList.add("enable-banner");
					body.classList.remove(
						"wallpaper-transparent",
						"no-banner-mode",
					);
					break;
				case "fullscreen":
					body.classList.remove("enable-banner");
					body.classList.add(
						"wallpaper-transparent",
						"no-banner-mode",
					);
					break;
				case "none":
					body.classList.remove(
						"enable-banner",
						"wallpaper-transparent",
					);
					body.classList.add("no-banner-mode");
					break;
			}

			requestAnimationFrame(function () {
				const mainContent = document.querySelector(
					".absolute.w-full.z-30.pointer-events-none",
				);
				if (mainContent) {
					if (wallpaperMode === "banner") {
						mainContent.style.top = `${BANNER_HEIGHT}vh`;
					} else {
						mainContent.style.top = "5.5rem";
					}
				}

				const mainGrid = document.getElementById("main-grid");
				if (mainGrid) {
					const currentLayout = "list";
					mainGrid.setAttribute("data-layout-mode", currentLayout);

					const rightSidebar = document.querySelector(
						".right-sidebar-container",
					);
					if (rightSidebar) {
						rightSidebar.classList.remove("hidden-in-grid-mode");
					}

					const postListContainer = document.getElementById(
						"post-list-container",
					);
					if (postListContainer) {
						postListContainer.classList.remove(
							"list-mode",
							"grid-mode",
						);
						postListContainer.classList.add("list-mode");
						postListContainer.classList.add("flex", "flex-col");
						postListContainer.classList.remove(
							"grid",
							"grid-cols-1",
							"lg:grid-cols-2",
							"gap-6",
						);
					}
				}
			});
		})();

		// const wallpaperMode = localStorage.getItem('wallpaperMode') || defaultWallpaperMode;

		function initWallpaperModeWithRetry() {
			applyWallpaperMode();

			var retryCount = 0;
			var maxRetries = 10;
			var checkInterval = setInterval(function () {
				var fullscreenWallpaper = document.querySelector(
					"[data-fullscreen-wallpaper]",
				);
				if (fullscreenWallpaper || retryCount >= maxRetries) {
					clearInterval(checkInterval);
					if (fullscreenWallpaper) {
						applyWallpaperMode();
					}
				}
				retryCount++;
			}, 150);
		}

		if (document.readyState === "loading") {
			document.addEventListener(
				"DOMContentLoaded",
				initWallpaperModeWithRetry,
			);
		} else {
			initWallpaperModeWithRetry();
		}

		function applyWallpaperMode() {
			var wallpaperMode =
				localStorage.getItem("wallpaperMode") || defaultWallpaperMode;
			var bannerWrapper = document.getElementById("banner-wrapper");
			var fullscreenWallpaper = document.querySelector(
				"[data-fullscreen-wallpaper]",
			);
			var navbar = document.getElementById("navbar");
			var body = document.body;
			var mainContent = document.querySelector(
				".absolute.w-full.z-30.pointer-events-none",
			);
			var tocWrapper = document.getElementById("toc-wrapper");

			var forceReflow = function () {
				void document.body.offsetHeight;
			};

			switch (wallpaperMode) {
				case "banner":
					if (bannerWrapper) {
						bannerWrapper.style.display = "block";
					}
					if (fullscreenWallpaper) {
						fullscreenWallpaper.style.display = "none";
					}
					if (tocWrapper) {
						const scrollTop = document.documentElement.scrollTop;
						const bannerHeight =
							window.innerHeight * (BANNER_HEIGHT / 100);
						if (scrollTop <= bannerHeight) {
							tocWrapper.classList.add("toc-hide");
						}
					}
					body.classList.remove("wallpaper-transparent");
					body.classList.remove("no-banner-mode");
					forceReflow();
					if (mainContent) {
						mainContent.style.removeProperty("top");
					}
					body.classList.add("enable-banner");
					if (navbar) {
						navbar.removeAttribute("data-dynamic-transparent");
						navbar.setAttribute(
							"data-transparent-mode",
							navbarTransparentMode,
						);
						if (
							navbarTransparentMode === "semifull" &&
							window.initSemifullScrollDetection
						) {
							window.initSemifullScrollDetection();
						}
					}
					forceReflow();
					break;

				case "fullscreen":
					if (bannerWrapper) {
						bannerWrapper.style.display = "none";
					}
					if (fullscreenWallpaper) {
						fullscreenWallpaper.style.display = "block";
					}
					if (tocWrapper) {
						tocWrapper.classList.remove("toc-hide");
					}
					body.classList.remove("enable-banner");
					forceReflow();
					if (mainContent) {
						mainContent.style.removeProperty("top");
					}
					body.classList.add("wallpaper-transparent");
					body.classList.add("no-banner-mode");
					if (navbar) {
						navbar.setAttribute("data-dynamic-transparent", "semi");
						navbar.removeAttribute("data-transparent-mode");
					}
					forceReflow();
					break;

				case "none":
					// 闂傚倸鍊搁崐鎼佸箠韫囨稑绀夋俊顖欑秿濞戞鏆嗛柛鏇ㄥ亞椤撳ジ姊洪柅鐐茶嫰婢у鈧鍠栭悘姘嚗閸曨剛绡€閹肩补鎳囬幐鍛磽?
					if (bannerWrapper) {
						bannerWrapper.style.display = "none";
					}
					if (fullscreenWallpaper) {
						fullscreenWallpaper.style.display = "none";
					}
					if (tocWrapper) {
						tocWrapper.classList.remove("toc-hide");
					}
					body.classList.remove("enable-banner");
					body.classList.remove("wallpaper-transparent");
					forceReflow();
					if (mainContent) {
						mainContent.style.removeProperty("top");
					}
					body.classList.add("no-banner-mode");
					if (navbar) {
						navbar.setAttribute("data-dynamic-transparent", "none");
						navbar.removeAttribute("data-transparent-mode");
					}
					forceReflow();
					break;
			}
		}

		window.addEventListener("wallpaper-mode-change", function (_event) {
			applyWallpaperMode();
		});

		function setupSwupLayoutSync() {

			if (typeof window !== "undefined" && window.swup) {
				window.swup.hooks.on("animation:out:start", function () {});

				window.swup.hooks.on("content:replace", function () {
					const mainGrid = document.getElementById("main-grid");
					if (mainGrid) {

						const currentLayout = "list";
						mainGrid.setAttribute(
							"data-layout-mode",
							currentLayout,
						);

						const rightSidebar = document.querySelector(
							".right-sidebar-container",
						);
						if (rightSidebar) {
							rightSidebar.classList.remove(
								"hidden-in-grid-mode",
							);
						}

						const postListContainer = document.getElementById(
							"post-list-container",
						);
						if (postListContainer) {
							postListContainer.classList.remove(
								"list-mode",
								"grid-mode",
							);
							postListContainer.classList.add("list-mode");
							postListContainer.classList.add("flex", "flex-col");
							postListContainer.classList.remove(
								"grid",
								"grid-cols-1",
								"lg:grid-cols-2",
								"gap-6",
							);
						}


						delete window.__pendingLayoutMode;
					}
				});

				return true;
			}
			return false;
		}

		if (!setupSwupLayoutSync()) {
			const checkSwup = setInterval(function () {
				if (setupSwupLayoutSync()) {
					clearInterval(checkSwup);
				}
			}, 50);

			setTimeout(function () {
				clearInterval(checkSwup);
			}, 2000);
		}

		document.addEventListener("swup:page:view", function () {
			applyWallpaperMode();

			requestAnimationFrame(function () {
				const mainGrid = document.getElementById("main-grid");
				if (mainGrid) {
					const currentLayout = "list";
					mainGrid.setAttribute("data-layout-mode", currentLayout);

					const rightSidebar = document.querySelector(
						".right-sidebar-container",
					);
					if (rightSidebar) {
						rightSidebar.classList.remove("hidden-in-grid-mode");
					}
				}
			});
		});
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", function () {
				const mainGrid = document.getElementById("main-grid");
				if (mainGrid) {
					const currentLayout = "list";
					mainGrid.setAttribute("data-layout-mode", currentLayout);

					const rightSidebar = document.querySelector(
						".right-sidebar-container",
					);
					if (rightSidebar) {
						rightSidebar.classList.remove("hidden-in-grid-mode");
					}
				}
			});
		}
