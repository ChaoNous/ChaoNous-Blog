/**
 * Banner and grid layout runtime.
 * Pure module — no self-initialization, no Swup hooks.
 * Called by layout-runtime.ts as the single orchestration entry point.
 */

const runtimeConfig = window.__mainGridRuntimeConfig || {};
const navbarTransparentMode = runtimeConfig.navbarTransparentMode || "semi";
const BANNER_HEIGHT = runtimeConfig.BANNER_HEIGHT || 40;
const BANNER_HEIGHT_EXTEND = runtimeConfig.BANNER_HEIGHT_EXTEND || 20;

// Responsive breakpoints (match constants.ts)
const BP_PHONE_XS = 479;
const BP_TABLET = 768;
const BP_MOBILE = 1279;

function getResponsiveBannerHeightVh() {
  const width = window.innerWidth;
  const isLandscape = window.matchMedia("(orientation: landscape)").matches;

  if (width <= BP_MOBILE && isLandscape) {
    return { value: 20, unit: "vh" };
  }
  if (width <= BP_PHONE_XS) {
    return { value: 220, unit: "px" };
  }
  if (width <= BP_TABLET - 1) {
    return { value: 260, unit: "px" };
  }
  if (width <= BP_MOBILE) {
    return { value: 45, unit: "vh" };
  }

  return { value: BANNER_HEIGHT, unit: "vh" };
}

function syncBannerPosition() {
  const bannerWrapper = document.getElementById("banner-wrapper");
  if (!bannerWrapper) return;

  const width = window.innerWidth;
  const banner = getResponsiveBannerHeightVh();

  if (width <= BP_MOBILE) {
    bannerWrapper.style.height = `${banner.value}${banner.unit}`;
    bannerWrapper.style.top = "0px";
    return;
  }

  bannerWrapper.style.removeProperty("height");
  bannerWrapper.style.top = `-${BANNER_HEIGHT_EXTEND}vh`;
}

function getMainContentTop() {
  const banner = getResponsiveBannerHeightVh();
  if (window.innerWidth <= BP_MOBILE) {
    return `${banner.value}${banner.unit}`;
  }

  return document.body.classList.contains("is-home")
    ? `calc(${BANNER_HEIGHT + BANNER_HEIGHT_EXTEND}vh + 2rem)`
    : `${BANNER_HEIGHT}vh`;
}

export function syncDesktopLayoutState() {
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

export function applyBannerLayout() {
  const bannerWrapper = document.getElementById("banner-wrapper");
  const navbar = document.getElementById("navbar");
  const mainContent = document.getElementById("main-content-shell");
  const tocWrapper = document.getElementById("toc-wrapper");

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

  void document.body.offsetHeight; // force reflow

  // On mobile, CSS media queries handle banner sizing.
  // Only apply JS layout on desktop to avoid CLS.
  if (window.innerWidth > BP_MOBILE) {
    syncBannerPosition();
    if (mainContent) {
      mainContent.style.top = getMainContentTop();
    }
  }

  document.body.classList.add("enable-banner");

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
}
