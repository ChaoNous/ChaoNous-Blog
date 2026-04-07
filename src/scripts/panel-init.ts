import type { PanelId } from "../utils/panel-manager";

let panelManagerInitialization: Promise<unknown> | null = null;

export async function initializePanelManager(): Promise<unknown> {
  if (!panelManagerInitialization) {
    panelManagerInitialization = (async () => {
      try {
        const { panelManager } = await import("../utils/panel-manager");
        const layoutWindow = window as Window & {
          __panelManagerOutsideClickBound?: boolean;
        };

        function setClickOutsideToClose(panel: string, ignores: string[]): void {
          document.addEventListener("click", async (event) => {
            const target = event.target;
            if (!(target instanceof Node)) return;

            for (const ignoreId of ignores) {
              const ignoreElement = document.getElementById(ignoreId);
              if (ignoreElement === target || ignoreElement?.contains(target)) {
                return;
              }
            }

            await panelManager.closePanel(panel as PanelId);
          });
        }

        if (!layoutWindow.__panelManagerOutsideClickBound) {
          layoutWindow.__panelManagerOutsideClickBound = true;

          setClickOutsideToClose("display-setting", [
            "display-setting",
            "display-settings-switch",
          ]);
          setClickOutsideToClose("nav-menu-panel", [
            "nav-menu-panel",
            "nav-menu-switch",
          ]);
          setClickOutsideToClose("search-panel", [
            "search-panel",
            "search-bar",
            "search-switch",
          ]);
        }

        return panelManager;
      } catch (error) {
        console.error("Failed to initialize panel manager:", error);
        return null;
      }
    })();
  }

  return panelManagerInitialization;
}
