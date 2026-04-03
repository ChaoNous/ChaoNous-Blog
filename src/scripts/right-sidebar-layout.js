import { registerPageScript } from "./page-lifecycle.ts";

function showRightSidebar() {
  const rightSidebar = document.querySelector(".right-sidebar-container");
  if (rightSidebar) {
    rightSidebar.classList.remove("hidden-in-grid-mode");
    rightSidebar.style.display = "";
  }

  const mainGrid = document.getElementById("main-grid");
  if (mainGrid) {
    mainGrid.setAttribute("data-layout-mode", "list");
    mainGrid.style.gridTemplateColumns = "";
  }
}

function initialize() {
  showRightSidebar();
}

registerPageScript("right-sidebar-layout", {
  init() {
    initialize();
  },
});

if (typeof module !== "undefined" && module.exports) {
  module.exports = { showRightSidebar };
}

if (typeof window !== "undefined") {
  window.rightSidebarLayout = { showRightSidebar };
}
