const runtimeConfig = window.__mainGridRuntimeConfig || {};
const navbarTransparentMode = runtimeConfig.navbarTransparentMode || "semi";
const BANNER_HEIGHT = runtimeConfig.BANNER_HEIGHT || 35;
const BANNER_HEIGHT_EXTEND = runtimeConfig.BANNER_HEIGHT_EXTEND || 30;

function getResponsiveBannerHeightVh() {
  const width = window.innerWidth;
  const isLandscape = window.matchMedia("(orientation: landscape)").matches;

  // 横屏模式：20vh（与CSS一致）
  if (width <= 1279 && isLandscape) {
    return { value: 20, unit: "vh" };
  }

  // 小屏手机竖屏：固定 220px
  if (width <= 479) {
    return { value: 220, unit: "px" };
  }

  // 中小屏手机竖屏：固定 260px
  if (width <= 767) {
    return { value: 260, unit: "px" };
  }

  // 平板竖屏：45vh
  if (width <= 1279) {
    return { value: 45, unit: "vh" };
  }

  return { value: BANNER_HEIGHT, unit: "vh" };
}

function syncBannerPosition() {
  const bannerWrapper = document.getElementById("banner-wrapper");
  if (!bannerWrapper) {
    return;
  }

  const width = window.innerWidth;
  const banner = getResponsiveBannerHeightVh();

  if (width <= 1279) {
    bannerWrapper.style.height = `${banner.value}${banner.unit}`;
    bannerWrapper.style.top = "0px";
    return;
  }

  bannerWrapper.style.removeProperty("height");
  bannerWrapper.style.top = `-${BANNER_HEIGHT_EXTEND}vh`;
}

function getMainContentTop() {
  const banner = getResponsiveBannerHeightVh();
  if (window.innerWidth <= 1279) {
    return `${banner.value}${banner.unit}`;
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

  const leftSidebar = document.querySelector(".sidebar-container");
  if (leftSidebar) {
    leftSidebar.classList.remove("hidden-in-grid-mode");
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

(function applyInitialLayout() {
  const body = document.body;
  body.classList.add("enable-banner");

  requestAnimationFrame(() => {
    syncBannerPosition();

    const mainContent = document.getElementById("main-content-shell");
    if (mainContent) {
      mainContent.style.top = getMainContentTop();
    }

    syncDesktopLayoutState();
  });
})();

function applyBannerLayout() {
  const bannerWrapper = document.getElementById("banner-wrapper");
  const navbar = document.getElementById("navbar");
  const body = document.body;
  const mainContent = document.getElementById("main-content-shell");
  const tocWrapper = document.getElementById("toc-wrapper");

  const forceReflow = () => {
    void document.body.offsetHeight;
  };

  if (bannerWrapper) {
    bannerWrapper.style.display = "block";
  }

  if (tocWrapper) {
    const scrollTop = document.documentElement.scrollTop;
    const bannerHeight = window.innerHeight * (BANNER_HEIGHT / 100);
    if (scrollTop <= bannerHeight) {
      tocWrapper.classList.add("toc-hide");
    }
  }

  forceReflow();
  syncBannerPosition();
  if (mainContent) {
    mainContent.style.top = getMainContentTop();
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
    applyBannerLayout();
    requestAnimationFrame(() => {
      syncDesktopLayoutState();
    });
  });

  return true;
}

window.addEventListener("resize", function () {
  applyBannerLayout();
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    applyBannerLayout();
    syncDesktopLayoutState();
  });
} else {
  applyBannerLayout();
  syncDesktopLayoutState();
}

if (!setupSwupLayoutSync()) {
  document.addEventListener("swup:enable", setupSwupLayoutSync, {
    once: true,
  });
}
