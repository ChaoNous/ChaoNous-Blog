import { registerPageScript } from "./page-lifecycle.ts";

declare global {
  interface Window {
    themeOptimizer?: {
      hideCodeBlocksDuringTransition?: boolean;
    };
  }
}

class CodeBlockCollapser {
  private _processedBlocks = new WeakSet<Element>();
  private observer: MutationObserver | null;
  private isThemeChanging: boolean;

  constructor() {
    this.clearProcessedBlocks();
    this.observer = null;
    this.isThemeChanging = false;
    this.init();
  }

  init(): void {
    this.setupCodeBlocks();
    this.observePageChanges();
    this.setupThemeChangeListener();
    this.setupThemeOptimizerSync();
  }

  private setupThemeOptimizerSync(): void {
    this.syncWithThemeOptimizer();

    document.addEventListener("themeOptimizerReady", () => {
      this.syncWithThemeOptimizer();
    });
  }

  syncWithThemeOptimizer(): void {
    const codeBlocks = document.querySelectorAll(".expressive-code");

    if (window.themeOptimizer) {
      const shouldHideDuringTransition =
        window.themeOptimizer.hideCodeBlocksDuringTransition;

      codeBlocks.forEach((block) => {
        block.classList.toggle(
          "hide-during-transition",
          shouldHideDuringTransition,
        );
      });
      return;
    }

    codeBlocks.forEach((block) => {
      block.classList.add("hide-during-transition");
    });
  }

  private setupThemeChangeListener(): void {
    const themeObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type !== "attributes" ||
          (mutation.attributeName !== "class" &&
            mutation.attributeName !== "data-theme")
        ) {
          continue;
        }

        const isTransitioning = document.documentElement.classList.contains(
          "is-theme-transitioning",
        );

        if (isTransitioning && !this.isThemeChanging) {
          this.isThemeChanging = true;

          if (this.observer) {
            this.observer.disconnect();
          }

          document.querySelectorAll(".expressive-code").forEach((block) => {
            (block as HTMLElement).style.transition = "none";
          });
        } else if (!isTransitioning && this.isThemeChanging) {
          this.isThemeChanging = false;

          requestAnimationFrame(() => {
            document.querySelectorAll(".expressive-code").forEach((block) => {
              (block as HTMLElement).style.transition = "";
            });

            setTimeout(() => {
              this.observePageChanges();
            }, 50);
          });
        }

        break;
      }
    });

    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });
  }

  setupCodeBlocks(): void {
    requestAnimationFrame(() => {
      const codeBlocks = document.querySelectorAll(".expressive-code");

      codeBlocks.forEach((codeBlock) => {
        if (!this._processedBlocks.has(codeBlock)) {
          this.enhanceCodeBlock(codeBlock);
          this._processedBlocks.add(codeBlock);
        }
      });
    });
  }

  private enhanceCodeBlock(codeBlock: Element): void {
    const frame = codeBlock.querySelector(".frame");
    if (!frame) {
      return;
    }

    if (frame.classList.contains("has-title")) {
      return;
    }
    codeBlock.classList.add("collapsible", "expanded");

    const toggleBtn = this.createToggleButton();
    frame.appendChild(toggleBtn);

    this.bindToggleEvents(codeBlock, toggleBtn);
  }

  private createToggleButton(): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = "collapse-toggle-btn";
    button.type = "button";
    button.setAttribute("aria-label", "Collapse or expand code block");

    button.innerHTML = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <g fill="none">
          <path d="M24 0v24H0V0zM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"></path>
          <path fill="currentColor" d="m12 16.172l-4.95-4.95a1 1 0 1 0-1.414 1.414l5.657 5.657a1 1 0 0 0 1.414 0l5.657-5.657a1 1 0 0 0-1.414-1.414z"></path>
        </g>
      </svg>
    `;

    return button;
  }

  private bindToggleEvents(
    codeBlock: Element,
    button: HTMLButtonElement,
  ): void {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleCollapse(codeBlock);
    });

    button.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.toggleCollapse(codeBlock);
      }
    });
  }

  private toggleCollapse(codeBlock: Element): void {
    const isCollapsed = codeBlock.classList.contains("collapsed");

    requestAnimationFrame(() => {
      if (isCollapsed) {
        codeBlock.classList.remove("collapsed");
        codeBlock.classList.add("expanded");
      } else {
        codeBlock.classList.remove("expanded");
        codeBlock.classList.add("collapsed");
      }
    });

    const event = new CustomEvent("codeBlockToggle", {
      detail: { collapsed: !isCollapsed, element: codeBlock },
    });
    document.dispatchEvent(event);
  }

  private observePageChanges(): void {
    if (this.isThemeChanging) {
      return;
    }

    if (this.observer) {
      this.observer.disconnect();
    }

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    this.observer = new MutationObserver((mutations) => {
      if (this.isThemeChanging) {
        return;
      }

      let shouldReinit = false;

      for (const mutation of mutations) {
        if (mutation.type !== "childList" || mutation.addedNodes.length === 0) {
          continue;
        }

        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) {
            continue;
          }

          const el = node as Element;
          if (
            el.classList.contains("expressive-code") ||
            el.getElementsByClassName("expressive-code").length > 0
          ) {
            shouldReinit = true;
            break;
          }
        }

        if (shouldReinit) {
          break;
        }
      }

      if (shouldReinit) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => this.setupCodeBlocks(), 30);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.clearProcessedBlocks();
  }

  clearProcessedBlocks(): void {
    this._processedBlocks = new WeakSet();
  }
}

const codeBlockCollapser = new CodeBlockCollapser();

registerPageScript("code-collapse", {
  init() {
    codeBlockCollapser.clearProcessedBlocks();
    setTimeout(() => {
      codeBlockCollapser.setupCodeBlocks();
      codeBlockCollapser.syncWithThemeOptimizer();
    }, 50);

    return () => {
      codeBlockCollapser.destroy();
    };
  },
});
