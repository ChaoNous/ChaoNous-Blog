import { registerPageScript } from "./page-lifecycle";

type SidebarRuntimeConfig = {
  breakpoints: {
    mobile: number;
    tablet: number;
  };
  showSidebar: {
    mobile: boolean;
    tablet: boolean;
    desktop: boolean;
  };
  hasComponents: {
    mobile: boolean;
    tablet: boolean;
    desktop: boolean;
  };
};

function readSidebarConfig(sidebar: HTMLElement): SidebarRuntimeConfig {
  return {
    breakpoints: {
      mobile: Number.parseInt(sidebar.dataset.breakpointMobile || "1024", 10),
      tablet: Number.parseInt(sidebar.dataset.breakpointTablet || "1280", 10),
    },
    showSidebar: {
      mobile: sidebar.dataset.showMobile === "true",
      tablet: sidebar.dataset.showTablet === "true",
      desktop: sidebar.dataset.showDesktop === "true",
    },
    hasComponents: {
      mobile: sidebar.dataset.hasMobile === "true",
      tablet: sidebar.dataset.hasTablet === "true",
      desktop: sidebar.dataset.hasDesktop === "true",
    },
  };
}

class SidebarManager {
  private sidebar: HTMLElement;
  private config: SidebarRuntimeConfig;
  private handleResize = () => this.updateResponsiveDisplay();

  constructor(sidebar: HTMLElement) {
    this.sidebar = sidebar;
    this.config = readSidebarConfig(sidebar);
    this.init();
  }

  private init(): void {
    this.updateResponsiveDisplay();
    window.addEventListener("resize", this.handleResize);
  }

  private updateResponsiveDisplay(): void {
    const width = window.innerWidth;

    let deviceType: "mobile" | "tablet" | "desktop" = "desktop";
    if (width < this.config.breakpoints.mobile) {
      deviceType = "mobile";
    } else if (width < this.config.breakpoints.tablet) {
      deviceType = "tablet";
    }

    const shouldShow =
      this.config.showSidebar[deviceType] &&
      this.config.hasComponents[deviceType];

    this.sidebar.style.setProperty(
      `--sidebar-${deviceType}-display`,
      shouldShow ? "block" : "none",
    );
  }

  destroy(): void {
    window.removeEventListener("resize", this.handleResize);
  }
}

type SidebarWindow = Window & {
  __sidebarManager?: SidebarManager | null;
};

registerPageScript("sidebar-manager", {
  shouldRun() {
    return document.getElementById("sidebar") !== null;
  },
  init() {
    const sidebar = document.getElementById("sidebar");
    if (!(sidebar instanceof HTMLElement)) {
      return;
    }

    const sidebarWindow = window as SidebarWindow;
    sidebarWindow.__sidebarManager?.destroy();
    sidebarWindow.__sidebarManager = new SidebarManager(sidebar);

    return () => {
      sidebarWindow.__sidebarManager?.destroy();
      sidebarWindow.__sidebarManager = null;
    };
  },
});
