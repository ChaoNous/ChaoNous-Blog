import {
  BANNER_HEIGHT,
  BANNER_HEIGHT_HOME,
  BP_DESKTOP,
} from "../../constants/constants";

export function syncNavbarHomeState(isHomePage: boolean) {
  const navbar = document.getElementById("navbar");
  if (navbar) {
    navbar.setAttribute("data-is-home", isHomePage.toString());
  }
}

export function refreshNavbarTransparency() {
  const navbar = document.getElementById("navbar");
  if (!navbar) return;

  const transparentMode = navbar.getAttribute("data-transparent-mode");
  if (
    transparentMode === "semifull" &&
    typeof window.initSemifullScrollDetection === "function"
  ) {
    window.initSemifullScrollDetection();
  }
}

export function syncNavbarVisibility(
  scrollTop: number,
  bannerEnabled: boolean,
) {
  if (!bannerEnabled) return;

  const navbarWrapper = document.getElementById("navbar-wrapper");
  if (!navbarWrapper) return;

  const isHome =
    document.body.classList.contains("is-home") && window.innerWidth >= BP_DESKTOP;
  const currentBannerHeight = isHome ? BANNER_HEIGHT_HOME : BANNER_HEIGHT;
  const threshold = window.innerHeight * (currentBannerHeight / 100) - 88;

  if (scrollTop >= threshold) {
    navbarWrapper.classList.add("navbar-hidden");
  } else {
    navbarWrapper.classList.remove("navbar-hidden");
  }
}

export function handleNavbarLinkClick(
  scrollTop: number,
  bannerEnabled: boolean,
) {
  if (!bannerEnabled) return;

  const navbarWrapper = document.getElementById("navbar-wrapper");
  if (!navbarWrapper || !document.body.classList.contains("is-home")) return;

  const threshold = window.innerHeight * (BANNER_HEIGHT / 100) - 88;
  if (scrollTop >= threshold) {
    navbarWrapper.classList.add("navbar-hidden");
  }
}
