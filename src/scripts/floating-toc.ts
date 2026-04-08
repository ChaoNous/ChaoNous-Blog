import { registerPageScript } from "./page-lifecycle.ts";
import {
  getHeadingsFromContainer,
  getMinLevel,
  headingsToData,
  updateActiveHeading,
} from "../utils/toc-utils.js";

class FloatingTOC {
  private btn: HTMLElement | null;
  private panel: HTMLElement | null;
  private content: HTMLElement | null;
  private wrapper: HTMLElement | null;
  private isOpen = false;
  private observer: MutationObserver | null = null;
  private headings: Element[] = [];
  private tocItems: HTMLElement[] = [];
  private activeIndex = -1;
  private handleScroll = () => {
    this.updateProgress();
    this.updateActive();
  };
  private handleResize = () => {
    this.updateActive();
    this.updateProgress();
  };
  private handleDocumentClick = (event: MouseEvent) => {
    if (this.isOpen && !this.wrapper?.contains(event.target as Node)) {
      this.close();
    }
  };
  private handleContentClick = (event: MouseEvent) => {
    const link = (event.target as HTMLElement).closest("a");
    if (!link) return;
    event.preventDefault();
    const id = link.getAttribute("href")?.slice(1);
    if (!id) return;
    const element = document.getElementById(id);
    if (!element) return;
    const top = element.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: "smooth" });
    this.close();
  };
  private handleKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && this.isOpen) this.close();
  };
  private handleButtonClick = (event: MouseEvent) => {
    event.stopPropagation();
    this.toggle();
  };

  constructor() {
    this.btn = document.getElementById("floating-toc-btn");
    this.panel = document.getElementById("floating-toc-panel");
    this.content = document.getElementById("floating-toc-content");
    this.wrapper = document.querySelector(".floating-toc-wrapper");

    this.init();
  }

  private init() {
    window.addEventListener("scroll", this.handleScroll, { passive: true });
    window.addEventListener("resize", this.handleResize, { passive: true });

    this.bindEvents();
    this.generateTOC();
    this.observeContent();
    this.updateProgress();
  }

  private observeContent() {
    const contentWrapper = document.getElementById("post-container");
    if (contentWrapper) {
      this.observer = new MutationObserver(() => {
        this.generateTOC();
        this.updateProgress();
      });
      this.observer.observe(contentWrapper, {
        childList: true,
        subtree: true,
      });
    }
  }

  private updateProgress() {
    if (!this.btn) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;
    const scrollPercent = docHeight > 0 ? scrollTop / docHeight : 0;

    const circle = this.btn.querySelector(
      ".progress-ring-circle",
    ) as SVGCircleElement | null;
    if (circle) {
      const radius = circle.r.baseVal.value;
      const circumference = radius * 2 * Math.PI;
      const offset = Math.max(
        0,
        Math.min(circumference, circumference - scrollPercent * circumference),
      );
      circle.style.strokeDashoffset = offset.toString();
    }
  }

  private updateActive() {
    if (!this.content || this.headings.length === 0) return;
    const scrollY = window.scrollY;
    this.activeIndex = updateActiveHeading(
      this.headings,
      this.tocItems,
      scrollY,
      150,
    );

    if (this.isOpen && this.activeIndex >= 0) {
      const activeItem = this.tocItems[this.activeIndex];
      if (activeItem && this.content) {
        const panelRect = this.content.getBoundingClientRect();
        const itemRect = activeItem.getBoundingClientRect();
        if (
          itemRect.top < panelRect.top ||
          itemRect.bottom > panelRect.bottom
        ) {
          activeItem.scrollIntoView({ block: "nearest" });
        }
      }
    }
  }

  private generateTOC() {
    this.headings = getHeadingsFromContainer("post-container");

    if (this.headings.length === 0) {
      this.wrapper?.classList.remove("active-toc");
      this.wrapper?.classList.add("no-toc");
      return;
    }

    this.wrapper?.classList.remove("no-toc");
    this.wrapper?.classList.add("active-toc");

    const minLevel = getMinLevel(this.headings);
    const depthLevels = parseInt(this.wrapper?.dataset.depth || "3");
    const maxVisibleDepth = minLevel + depthLevels;

    const headingsData = headingsToData(this.headings);
    let html = "";
    let h1Count = 0;

    headingsData.forEach(
      (heading: { depth: number; slug: string; text: string }) => {
        if (heading.depth >= maxVisibleDepth) return;

        const indent = heading.depth - minLevel;
        const text = heading.text;
        let badge = "";

        if (heading.depth === minLevel) {
          h1Count++;
          badge = `<span class="floating-toc-badge">${h1Count}</span>`;
        } else if (heading.depth === minLevel + 1) {
          badge = '<span class="floating-toc-dot"></span>';
        } else {
          badge = '<span class="floating-toc-dot-small"></span>';
        }

        html += `<a href="#${heading.slug}" class="floating-toc-item" style="padding-left: ${0.5 + indent}rem" data-level="${heading.depth - minLevel}">${badge}<span class="floating-toc-text">${text}</span></a>`;
      },
    );

    if (this.content) {
      this.content.innerHTML = html;
      this.tocItems = Array.from(
        this.content.querySelectorAll(".floating-toc-item"),
      );
    }

    this.updateActive();
  }

  private bindEvents() {
    this.btn?.addEventListener("click", this.handleButtonClick);
    document.addEventListener("click", this.handleDocumentClick);
    this.content?.addEventListener("click", this.handleContentClick);
    document.addEventListener("keydown", this.handleKeydown);
  }

  private toggle() {
    this.isOpen ? this.close() : this.open();
  }

  private open() {
    this.isOpen = true;
    this.panel?.classList.add("show");
    this.btn?.classList.add("active");
    this.wrapper?.classList.add("active");
  }

  private close() {
    this.isOpen = false;
    this.panel?.classList.remove("show");
    this.btn?.classList.remove("active");
    this.wrapper?.classList.remove("active");
  }

  destroy() {
    this.close();
    this.observer?.disconnect();
    window.removeEventListener("scroll", this.handleScroll);
    window.removeEventListener("resize", this.handleResize);
    this.btn?.removeEventListener("click", this.handleButtonClick);
    document.removeEventListener("click", this.handleDocumentClick);
    this.content?.removeEventListener("click", this.handleContentClick);
    document.removeEventListener("keydown", this.handleKeydown);
    this.headings = [];
    this.tocItems = [];
  }
}

type FloatingTocWindow = Window & {
  __floatingTocInstance?: FloatingTOC | null;
};

registerPageScript("floating-toc", {
  shouldRun() {
    return document.querySelector(".floating-toc-wrapper") !== null;
  },
  init() {
    const floatingTocWindow = window as FloatingTocWindow;
    floatingTocWindow.__floatingTocInstance?.destroy();
    floatingTocWindow.__floatingTocInstance = new FloatingTOC();
    return () => {
      floatingTocWindow.__floatingTocInstance?.destroy();
      floatingTocWindow.__floatingTocInstance = null;
    };
  },
});
