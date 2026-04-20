export type PanelId = "display-setting";
class PanelManager {
  private activePanels: Set<PanelId> = new Set();
  private panelStack: PanelId[] = [];
  private readonly duration = 100;
  private animateIn(panel: HTMLElement): Promise<void> {
    return new Promise((resolve) => {
      const isThemeTransitioning = document.documentElement.classList.contains(
        "is-theme-transitioning",
      );
      if (isThemeTransitioning) {
        panel.classList.remove("float-panel-closed");
        panel.style.opacity = "1";
        panel.style.transform = "scale(1) translateY(0)";
        resolve();
        return;
      }
      panel.classList.remove("float-panel-closed");
      panel.style.opacity = "0";
      panel.style.transform = "scale(0.95) translateY(-10px)";
      panel.style.pointerEvents = "none";
      panel.offsetHeight;
      panel.style.transition = `all ${this.duration}ms ease-out`;
      requestAnimationFrame(() => {
        panel.style.opacity = "1";
        panel.style.transform = "scale(1) translateY(0)";
        panel.style.pointerEvents = "auto";
        setTimeout(() => {
          panel.style.transition = "";
          resolve();
        }, this.duration);
      });
    });
  }
  private animateOut(panel: HTMLElement): Promise<void> {
    return new Promise((resolve) => {
      const isThemeTransitioning = document.documentElement.classList.contains(
        "is-theme-transitioning",
      );
      if (isThemeTransitioning) {
        panel.classList.add("float-panel-closed");
        panel.style.opacity = "";
        panel.style.transform = "";
        resolve();
        return;
      }
      panel.style.transition = `all ${this.duration}ms ease-out`;
      panel.style.pointerEvents = "none";
      panel.style.opacity = "0";
      panel.style.transform = "scale(0.95) translateY(-10px)";
      setTimeout(() => {
        panel.classList.add("float-panel-closed");
        panel.style.transition = "";
        panel.style.opacity = "";
        panel.style.transform = "";
        panel.style.pointerEvents = "";
        resolve();
      }, this.duration);
    });
  }
  async togglePanel(panelId: PanelId, forceState?: boolean): Promise<boolean> {
    const panel = document.getElementById(panelId);
    if (!panel) {
      console.warn(`Panel ${panelId} not found`);
      return false;
    }
    const isClosed = panel.classList.contains("float-panel-closed");
    const shouldOpen = forceState !== undefined ? forceState : isClosed;
    if (shouldOpen) {
      await this.closeAllPanelsExcept(panelId);
      await this.animateIn(panel);
      this.activePanels.add(panelId);
      this.panelStack = this.panelStack.filter((id) => id !== panelId);
      this.panelStack.push(panelId);
      return true;
    }
    await this.closePanel(panelId);
    return false;
  }
  async closePanel(panelId: PanelId): Promise<void> {
    const panel = document.getElementById(panelId);
    if (panel && !panel.classList.contains("float-panel-closed")) {
      await this.animateOut(panel);
      this.activePanels.delete(panelId);
      this.panelStack = this.panelStack.filter((id) => id !== panelId);
    }
  }
  async closeAllPanelsExcept(exceptPanelId?: PanelId): Promise<void> {
    const closingPromises = Array.from(this.activePanels)
      .filter((panelId) => panelId !== exceptPanelId)
      .map((panelId) => this.closePanel(panelId));
    await Promise.all(closingPromises);
  }
}
export const panelManager = new PanelManager();
