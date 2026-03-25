import { registerPageScript } from "./page-lifecycle.js";

class CodeBlockCollapser {
  constructor() {
    this.processedBlocks = new WeakSet();
    this.observer = null;
    this.isThemeChanging = false;
    this.debug = false;
    this.init();
  }

  log(...args) {
    if (this.debug) {
      console.log("[CodeBlockCollapser]", ...args);
    }
  }

  init() {
    this.log("Initializing...");
    this.log("Setting up code blocks");
    this.setupCodeBlocks();
    this.observePageChanges();
    this.setupThemeChangeListener();
    this.setupThemeOptimizerSync();
  }

  setupThemeOptimizerSync() {
    this.syncWithThemeOptimizer();

    document.addEventListener("themeOptimizerReady", () => {
      this.log("Theme optimizer ready, syncing code block behavior");
      this.syncWithThemeOptimizer();
    });
  }

  syncWithThemeOptimizer() {
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

      this.log(
        `Synced with theme optimizer: hide code blocks during transition = ${shouldHideDuringTransition}`,
      );
      return;
    }

    codeBlocks.forEach((block) => {
      block.classList.add("hide-during-transition");
    });

    this.log("Theme optimizer not available, applied default behavior");
  }

  setupThemeChangeListener() {
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
            block.style.transition = "none";
          });
        } else if (!isTransitioning && this.isThemeChanging) {
          this.isThemeChanging = false;

          requestAnimationFrame(() => {
            document.querySelectorAll(".expressive-code").forEach((block) => {
              block.style.transition = "";
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

  setupCodeBlocks() {
    requestAnimationFrame(() => {
      const codeBlocks = document.querySelectorAll(".expressive-code");
      this.log(`Found ${codeBlocks.length} code blocks to process`);

      codeBlocks.forEach((codeBlock, index) => {
        if (!this.processedBlocks.has(codeBlock)) {
          this.log(`Enhancing code block ${index + 1}`);
          this.enhanceCodeBlock(codeBlock);
          this.processedBlocks.add(codeBlock);
        } else {
          this.log(`Code block ${index + 1} already processed`);
        }
      });
    });
  }

  enhanceCodeBlock(codeBlock) {
    const frame = codeBlock.querySelector(".frame");
    if (!frame) {
      this.log("No frame found in code block, skipping");
      return;
    }

    if (frame.classList.contains("has-title")) {
      this.log("Code block has title, skipping collapse feature");
      return;
    }

    this.log("Adding collapse feature to code block");
    codeBlock.classList.add("collapsible", "expanded");

    const toggleBtn = this.createToggleButton();
    frame.appendChild(toggleBtn);

    this.bindToggleEvents(codeBlock, toggleBtn);
  }

  createToggleButton() {
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

  bindToggleEvents(codeBlock, button) {
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

  toggleCollapse(codeBlock) {
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

  observePageChanges() {
    if (this.isThemeChanging) {
      return;
    }

    if (this.observer) {
      this.observer.disconnect();
    }

    let debounceTimer = null;

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

          if (
            node.classList.contains("expressive-code") ||
            (node.getElementsByClassName &&
              node.getElementsByClassName("expressive-code").length > 0)
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
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => this.setupCodeBlocks(), 30);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    this.processedBlocks = new WeakSet();
  }

  collapseAll() {
    const allBlocks = document.querySelectorAll(".expressive-code.expanded");
    allBlocks.forEach((block) => {
      this.toggleCollapse(block);
    });
  }

  expandAll() {
    const allBlocks = document.querySelectorAll(".expressive-code.collapsed");
    allBlocks.forEach((block) => {
      this.toggleCollapse(block);
    });
  }
}

const codeBlockCollapser = new CodeBlockCollapser();

window.CodeBlockCollapser = CodeBlockCollapser;
window.codeBlockCollapser = codeBlockCollapser;

registerPageScript("code-collapse", {
  init() {
    codeBlockCollapser.processedBlocks = new WeakSet();
    setTimeout(() => {
      codeBlockCollapser.setupCodeBlocks();
      codeBlockCollapser.syncWithThemeOptimizer();
    }, 50);

    return () => {
      codeBlockCollapser.destroy();
    };
  },
});
