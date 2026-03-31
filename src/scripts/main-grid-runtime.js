const runtimeConfig = window.__mainGridRuntimeConfig || {};
const navbarTransparentMode = runtimeConfig.navbarTransparentMode || "semi";
const defaultWallpaperMode = runtimeConfig.defaultWallpaperMode || "banner";
const BANNER_HEIGHT = runtimeConfig.BANNER_HEIGHT || 35;
const BANNER_HEIGHT_EXTEND = runtimeConfig.BANNER_HEIGHT_EXTEND || 30;

function getResponsiveBannerHeightVh() {
  const width = window.innerWidth;
  const isLandscape = window.matchMedia("(orientation: landscape)").matches;

  // 横屏模式：20vh（与CSS一致）
  if (width <= 1279 && isLandscape) {
    return 20;
  }

  // 小屏手机竖屏：30vh
  if (width <= 479) {
    return 30;
  }

  // 中小屏手机竖屏：35vh
  if (width <= 767) {
    return 35;
  }

  // 平板竖屏：45vh
  if (width <= 1279) {
    return 45;
  }

  return BANNER_HEIGHT;
}

function syncBannerPosition(wallpaperMode) {
  const bannerWrapper = document.getElementById("banner-wrapper");
  if (!bannerWrapper) {
    return;
  }

  if (wallpaperMode !== "banner") {
    bannerWrapper.style.removeProperty("height");
    bannerWrapper.style.removeProperty("top");
    return;
  }

  const width = window.innerWidth;
  const responsiveBannerHeight = getResponsiveBannerHeightVh();

  if (width <= 1279) {
    // 手机端使用 visualViewport 获取实际可见高度，确保浏览器UI显隐时效果一致
    const isLandscape = window.matchMedia("(orientation: landscape)").matches;
    if (!isLandscape && width <= 767 && window.visualViewport) {
      const visibleHeight = window.visualViewport.height;
      const bannerPx = visibleHeight * (responsiveBannerHeight / 100);
      bannerWrapper.style.height = `${bannerPx}px`;
    } else {
      bannerWrapper.style.height = `${responsiveBannerHeight}vh`;
    }
    bannerWrapper.style.top = "0px";
    return;
  }

  bannerWrapper.style.removeProperty("height");
  bannerWrapper.style.top = `-${BANNER_HEIGHT_EXTEND}vh`;
}

function getMainContentTop(wallpaperMode) {
  if (wallpaperMode !== "banner") {
    return "5.5rem";
  }

  const responsiveBannerHeight = getResponsiveBannerHeightVh();
  if (window.innerWidth <= 1279) {
    // 手机端竖屏需要额外偏移 3rem，避免遮挡 banner 副标题
    const isLandscape = window.matchMedia("(orientation: landscape)").matches;
    if (!isLandscape && window.innerWidth <= 767 && window.visualViewport) {
      const visibleHeight = window.visualViewport.height;
      const bannerPx = visibleHeight * (responsiveBannerHeight / 100);
      return `calc(${bannerPx}px + 3rem)`;
    }
    return `${responsiveBannerHeight}vh`;
  }

  return document.body.classList.contains("is-home")
    ? `calc(${BANNER_HEIGHT + BANNER_HEIGHT_EXTEND}vh + 2rem)`
    : `${BANNER_HEIGHT}vh`;
}

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
    syncBannerPosition(wallpaperMode);

    const mainContent = document.getElementById("main-content-shell");
    if (mainContent) {
      mainContent.style.top = getMainContentTop(wallpaperMode);
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
  const mainContent = document.getElementById("main-content-shell");
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
      syncBannerPosition(wallpaperMode);
      if (mainContent) {
        mainContent.style.top = getMainContentTop(wallpaperMode);
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
        bannerWrapper.style.removeProperty("height");
        bannerWrapper.style.removeProperty("top");
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
        mainContent.style.top = getMainContentTop(wallpaperMode);
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
        bannerWrapper.style.removeProperty("height");
        bannerWrapper.style.removeProperty("top");
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
        mainContent.style.top = getMainContentTop(wallpaperMode);
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

  const wallpaperMode =
    localStorage.getItem("wallpaperMode") || defaultWallpaperMode;
  if (wallpaperMode !== "fullscreen") {
    return;
  }

  if (document.querySelector("[data-fullscreen-wallpaper]")) {
    applyWallpaperMode();
    return;
  }

  const observer = new MutationObserver(() => {
    if (!document.querySelector("[data-fullscreen-wallpaper]")) {
      return;
    }

    observer.disconnect();
    applyWallpaperMode();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  window.setTimeout(() => {
    observer.disconnect();
  }, 2000);
}

function setupSwupLayoutSync() {
  if (typeof window === "undefined" || !window.swup?.hooks) {
    return false;
  }

  if (window.__mainGridRuntimeHooksRegistered) {
    return true;
  }

  window.__mainGridRuntimeHooksRegistered = true;

  window.swup.hooks.on("content:replace", function () {
    if (document.getElementById("main-grid")) {
      syncDesktopLayoutState();
      delete window.__pendingLayoutMode;
    }
  });

  window.swup.hooks.on("page:view", function () {
    applyWallpaperMode();
    requestAnimationFrame(() => {
      syncDesktopLayoutState();
    });
  });

  return true;
}

window.addEventListener("wallpaper-mode-change", function () {
  applyWallpaperMode();
});

window.addEventListener("resize", function () {
  applyWallpaperMode();
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initWallpaperModeWithRetry();
    syncDesktopLayoutState();
  });
} else {
  initWallpaperModeWithRetry();
  syncDesktopLayoutState();
}

if (!setupSwupLayoutSync()) {
  document.addEventListener("swup:enable", setupSwupLayoutSync, {
    once: true,
  });
}
