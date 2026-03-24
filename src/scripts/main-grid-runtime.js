const runtimeConfig = window.__mainGridRuntimeConfig || {};
const navbarTransparentMode = runtimeConfig.navbarTransparentMode || "semi";
const defaultWallpaperMode = runtimeConfig.defaultWallpaperMode || "banner";
const BANNER_HEIGHT = runtimeConfig.BANNER_HEIGHT || 35;

function syncDesktopLayoutState() {
	const mainGrid = document.getElementById("main-grid");
	if (mainGrid) {
		mainGrid.setAttribute("data-layout-mode", "list");
	}

	const rightSidebar = document.querySelector(".right-sidebar-container");
	if (rightSidebar) {
		rightSidebar.classList.remove("hidden-in-grid-mode");
	}

	const postListContainer = document.getElementById("post-list-container");
	if (postListContainer) {
		postListContainer.classList.remove("list-mode", "grid-mode");
		postListContainer.classList.add("list-mode", "flex", "flex-col");
		postListContainer.classList.remove(
			"grid",
			"grid-cols-1",
			"lg:grid-cols-2",
			"gap-6",
		);
	}
}

(function applyInitialWallpaperClasses() {
	const wallpaperMode =
		localStorage.getItem("wallpaperMode") || defaultWallpaperMode;
	const body = document.body;

	switch (wallpaperMode) {
		case "banner":
			body.classList.add("enable-banner");
			body.classList.remove("wallpaper-transparent", "no-banner-mode");
			break;
		case "fullscreen":
			body.classList.remove("enable-banner");
			body.classList.add("wallpaper-transparent", "no-banner-mode");
			break;
		case "none":
			body.classList.remove("enable-banner", "wallpaper-transparent");
			body.classList.add("no-banner-mode");
			break;
	}

	requestAnimationFrame(() => {
		const mainContent = document.querySelector(
			".absolute.w-full.z-30.pointer-events-none",
		);
		if (mainContent) {
			mainContent.style.top =
				wallpaperMode === "banner" ? `${BANNER_HEIGHT}vh` : "5.5rem";
		}

		syncDesktopLayoutState();
	});
})();

function applyWallpaperMode() {
	const wallpaperMode =
		localStorage.getItem("wallpaperMode") || defaultWallpaperMode;
	const bannerWrapper = document.getElementById("banner-wrapper");
	const fullscreenWallpaper = document.querySelector(
		"[data-fullscreen-wallpaper]",
	);
	const navbar = document.getElementById("navbar");
	const body = document.body;
	const mainContent = document.querySelector(
		".absolute.w-full.z-30.pointer-events-none",
	);
	const tocWrapper = document.getElementById("toc-wrapper");

	const forceReflow = () => {
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
				const bannerHeight = window.innerHeight * (BANNER_HEIGHT / 100);
				if (scrollTop <= bannerHeight) {
					tocWrapper.classList.add("toc-hide");
				}
			}
			body.classList.remove("wallpaper-transparent", "no-banner-mode");
			forceReflow();
			if (mainContent) {
				mainContent.style.removeProperty("top");
			}
			body.classList.add("enable-banner");
			if (navbar) {
				navbar.removeAttribute("data-dynamic-transparent");
				navbar.setAttribute("data-transparent-mode", navbarTransparentMode);
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
			body.classList.add("wallpaper-transparent", "no-banner-mode");
			if (navbar) {
				navbar.setAttribute("data-dynamic-transparent", "semi");
				navbar.removeAttribute("data-transparent-mode");
			}
			forceReflow();
			break;

		case "none":
			if (bannerWrapper) {
				bannerWrapper.style.display = "none";
			}
			if (fullscreenWallpaper) {
				fullscreenWallpaper.style.display = "none";
			}
			if (tocWrapper) {
				tocWrapper.classList.remove("toc-hide");
			}
			body.classList.remove("enable-banner", "wallpaper-transparent");
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

function initWallpaperModeWithRetry() {
	applyWallpaperMode();

	let retryCount = 0;
	const maxRetries = 10;
	const checkInterval = setInterval(() => {
		const fullscreenWallpaper = document.querySelector(
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

function setupSwupLayoutSync() {
	if (typeof window === "undefined" || !window.swup) {
		return false;
	}

	window.swup.hooks.on("animation:out:start", function () {});

	window.swup.hooks.on("content:replace", function () {
		if (document.getElementById("main-grid")) {
			syncDesktopLayoutState();
			delete window.__pendingLayoutMode;
		}
	});

	return true;
}

window.addEventListener("wallpaper-mode-change", function (_event) {
	applyWallpaperMode();
});

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initWallpaperModeWithRetry);
	document.addEventListener("DOMContentLoaded", syncDesktopLayoutState);
} else {
	initWallpaperModeWithRetry();
	syncDesktopLayoutState();
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
	requestAnimationFrame(() => {
		syncDesktopLayoutState();
	});
});
