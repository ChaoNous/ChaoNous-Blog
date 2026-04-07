import { registerPageScript } from "./page-lifecycle.ts";

function showRightSidebar(): void {
  const rightSidebar = document.querySelector<HTMLElement>(
    ".right-sidebar-container",
  );
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

registerPageScript("right-sidebar-layout", {
  init() {
    showRightSidebar();
  },
});
