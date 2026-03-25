import { registerPageScript } from "../scripts/page-lifecycle.js";

/**
 * Central animation runtime for page transitions and component-level effects.
 */
export interface AnimationConfig {
  duration?: number;
  delay?: number;
  easing?: string;
  direction?: "up" | "down" | "left" | "right";
}

export class AnimationManager {
  private static instance: AnimationManager;
  private isAnimating = false;
  private animationQueue: (() => void)[] = [];
  private swupHooksBound = false;

  static getInstance(): AnimationManager {
    if (!AnimationManager.instance) {
      AnimationManager.instance = new AnimationManager();
    }
    return AnimationManager.instance;
  }

  init(): void {
    this.setupSwupIntegration();
    this.setupScrollAnimations();
  }

  private setupSwupIntegration(): void {
    if (
      this.swupHooksBound ||
      typeof window === "undefined" ||
      !(window as any).swup?.hooks
    ) {
      return;
    }

    this.swupHooksBound = true;
    const swup = (window as any).swup;

    swup.hooks.on("animation:out:start", () => {
      this.triggerPageLeaveAnimation();
    });

    swup.hooks.on("animation:in:start", () => {
      this.triggerPageEnterAnimation();
    });

    swup.hooks.on("content:replace", () => {
      setTimeout(() => {
        this.initializePageAnimations();
      }, 50);
    });
  }

  private triggerPageLeaveAnimation(): void {
    this.isAnimating = true;
    document.documentElement.classList.add("is-leaving");

    const isMobile = window.innerWidth <= 768;
    const delay = isMobile ? 10 : 30;
    const mainElements = document.querySelectorAll(".transition-leaving");

    mainElements.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add("animate-leave");
      }, index * delay);
    });
  }

  private triggerPageEnterAnimation(): void {
    document.documentElement.classList.remove("is-leaving");
    document.documentElement.classList.add("is-entering");

    const elements = document.querySelectorAll(".animate-leave");
    elements.forEach((element) => {
      element.classList.remove("animate-leave");
    });

    setTimeout(() => {
      document.documentElement.classList.remove("is-entering");
      this.isAnimating = false;
      this.processAnimationQueue();
    }, 300);
  }

  private initializePageAnimations(): void {
    const animatedElements = document.querySelectorAll(".onload-animation");

    animatedElements.forEach((element, index) => {
      const htmlElement = element as HTMLElement;
      const delay =
        Number.parseInt(htmlElement.style.animationDelay, 10) || index * 50;

      htmlElement.style.opacity = "0";
      htmlElement.style.transform = "translateY(1.5rem)";

      setTimeout(() => {
        htmlElement.style.transition =
          "opacity 320ms cubic-bezier(0.4, 0, 0.2, 1), transform 320ms cubic-bezier(0.4, 0, 0.2, 1)";
        htmlElement.style.opacity = "1";
        htmlElement.style.transform = "translateY(0)";
      }, delay);
    });

    this.initializeSidebarComponents();
  }

  private initializeSidebarComponents(): void {
    const sidebar = document.getElementById("sidebar");
    if (sidebar) {
      sidebar.dispatchEvent(new CustomEvent("sidebar:init"));
    }

    document.dispatchEvent(new CustomEvent("page:reinit"));
  }

  private setupScrollAnimations(): void {
    if (typeof window === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -100px 0px",
        threshold: 0.1,
      },
    );

    document.querySelectorAll(".animate-on-scroll").forEach((element) => {
      observer.observe(element);
    });
  }

  queueAnimation(callback: () => void): void {
    if (this.isAnimating) {
      this.animationQueue.push(callback);
      return;
    }

    callback();
  }

  private processAnimationQueue(): void {
    while (this.animationQueue.length > 0) {
      const callback = this.animationQueue.shift();
      callback?.();
    }
  }

  createAnimation(element: HTMLElement, config: AnimationConfig): void {
    const {
      duration = 300,
      delay = 0,
      easing = "cubic-bezier(0.4, 0, 0.2, 1)",
      direction = "up",
    } = config;

    const transforms = {
      up: "translateY(1.5rem)",
      down: "translateY(-1.5rem)",
      left: "translateX(1.5rem)",
      right: "translateX(-1.5rem)",
    };

    element.style.opacity = "0";
    element.style.transform = transforms[direction];
    element.style.transition = `opacity ${duration}ms ${easing}, transform ${duration}ms ${easing}`;

    setTimeout(() => {
      element.style.opacity = "1";
      element.style.transform = "translate(0)";
    }, delay);
  }

  staggerAnimations(
    elements: NodeListOf<Element> | HTMLElement[],
    config: AnimationConfig & { stagger?: number } = {},
  ): void {
    const { stagger = 50, ...animationConfig } = config;

    elements.forEach((element: Element | HTMLElement, index: number) => {
      this.createAnimation(element as HTMLElement, {
        ...animationConfig,
        delay: (animationConfig.delay || 0) + index * stagger,
      });
    });
  }

  isCurrentlyAnimating(): boolean {
    return this.isAnimating;
  }
}

export const animationManager = AnimationManager.getInstance();

if (typeof window !== "undefined") {
  registerPageScript("animation-manager", {
    init() {
      animationManager.init();
    },
  });
}
