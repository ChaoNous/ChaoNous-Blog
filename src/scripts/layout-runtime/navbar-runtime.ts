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

export function handleNavbarLinkClick(_scrollTop: number) {
  // Banner removed, no longer need banner-based logic
}
