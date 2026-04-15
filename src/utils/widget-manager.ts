import { sidebarLayoutConfig } from "../config";
import type {
  SidebarLayoutConfig,
  WidgetComponentConfig,
  WidgetComponentType,
} from "../types/config";

export class WidgetManager {
  private config: SidebarLayoutConfig;

  constructor(config: SidebarLayoutConfig = sidebarLayoutConfig) {
    this.config = config;
  }

  getConfig(): SidebarLayoutConfig {
    return this.config;
  }

  getComponentsByPosition(
    position: "top" | "sticky",
    sidebar: "left" | "right" | "drawer" = "left",
    deviceType: "mobile" | "tablet" | "desktop" = "desktop",
  ): WidgetComponentConfig[] {
    let activeSidebar = sidebar;

    if (deviceType === "mobile") {
      activeSidebar = "drawer";
    } else if (deviceType === "tablet") {
      if (sidebar === "right") {
        return [];
      }

      if (sidebar === "left") {
        activeSidebar =
          this.config.components.left.length > 0 ? "left" : "right";
      }
    }

    const componentTypes = this.config.components[activeSidebar] || [];

    return componentTypes
      .map((type) => {
        const prop = this.config.properties.find((p) => p.type === type);
        if (prop && prop.position === position) {
          return prop;
        }

        if (!prop && position === "top") {
          return { type, position: "top" } as WidgetComponentConfig;
        }

        return null;
      })
      .filter(Boolean) as WidgetComponentConfig[];
  }

  getAnimationDelay(component: WidgetComponentConfig, index: number): number {
    if (component.animationDelay !== undefined) {
      return component.animationDelay;
    }

    if (this.config.defaultAnimation.enable) {
      return (
        this.config.defaultAnimation.baseDelay +
        index * this.config.defaultAnimation.increment
      );
    }

    return 0;
  }

  getComponentClass(component: WidgetComponentConfig, _index: number): string {
    const classes: string[] = [];

    if (component.class) {
      classes.push(component.class);
    }

    if (component.responsive?.hidden) {
      component.responsive.hidden.forEach((device) => {
        switch (device) {
          case "mobile":
            classes.push("hidden", "md:block");
            break;
          case "tablet":
            classes.push("md:hidden", "lg:block");
            break;
          case "desktop":
            classes.push("lg:hidden");
            break;
        }
      });
    }

    return classes.join(" ");
  }

  getComponentStyle(component: WidgetComponentConfig, index: number): string {
    const styles: string[] = [];

    if (component.style) {
      styles.push(component.style);
    }

    const animationDelay = this.getAnimationDelay(component, index);
    if (animationDelay > 0) {
      styles.push(`animation-delay: ${animationDelay}ms`);
    }

    return styles.join("; ");
  }

  isCollapsed(component: WidgetComponentConfig, itemCount: number): boolean {
    if (!component.responsive?.collapseThreshold) {
      return false;
    }

    return itemCount >= component.responsive.collapseThreshold;
  }

  shouldShowSidebar(deviceType: "mobile" | "tablet" | "desktop"): boolean {
    if (deviceType === "mobile") {
      return this.config.components.drawer.length > 0;
    }

    return (
      this.config.components.left.length > 0 ||
      (this.config.components.right?.length || 0) > 0
    );
  }

  getBreakpoints(): SidebarLayoutConfig["responsive"]["breakpoints"] {
    return this.config.responsive.breakpoints;
  }

  getVisibleComponentsForPage(
    components: WidgetComponentConfig[],
    isPostPage: boolean,
  ): WidgetComponentConfig[] {
    return components.filter((component) => {
      if (
        component.type === "profile" ||
        component.type === "categories" ||
        component.type === "site-stats"
      ) {
        return !isPostPage;
      }

      if (component.type === "card-toc") {
        return isPostPage;
      }

      return true;
    });
  }

  updateConfig(newConfig: Partial<SidebarLayoutConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  addComponentToLayout(
    type: WidgetComponentType,
    sidebar: "left" | "right" | "drawer" = "left",
  ): void {
    const list = this.config.components[sidebar];
    if (list && !list.includes(type)) {
      list.push(type);
    }
  }

  removeComponentFromLayout(type: WidgetComponentType): void {
    this.config.components.left = this.config.components.left.filter(
      (t) => t !== type,
    );
    if (this.config.components.right) {
      this.config.components.right = this.config.components.right.filter(
        (t) => t !== type,
      );
    }
    this.config.components.drawer = this.config.components.drawer.filter(
      (t) => t !== type,
    );
  }
}

export const widgetManager: WidgetManager = new WidgetManager();
