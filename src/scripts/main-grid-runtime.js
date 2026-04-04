/**
 * Grid layout runtime.
 * Pure module — no self-initialization, no Swup hooks.
 * Called by layout-runtime.ts as the single orchestration entry point.
 */

const runtimeConfig = window.__mainGridRuntimeConfig || {};
const navbarTransparentMode = runtimeConfig.navbarTransparentMode || "semi";

// Responsive breakpoints (match constants.ts)
const BP_TABLET = 768;

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

export function applyLayout() {
  const navbar = document.getElementById("navbar");
  const tocWrapper = document.getElementById("toc-wrapper");

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
