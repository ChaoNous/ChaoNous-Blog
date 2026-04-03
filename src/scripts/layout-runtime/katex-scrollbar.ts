export function initCustomScrollbar(): void {
  const katexElements = document.querySelectorAll(
    ".katex-display:not([data-scrollbar-initialized])",
  ) as NodeListOf<HTMLElement>;

  katexElements.forEach((element) => {
    if (!element.parentNode) return;

    const container = document.createElement("div");
    container.className = "katex-display-container";
    element.parentNode.insertBefore(container, element);
    container.appendChild(element);

    container.style.cssText = `
      overflow-x: auto;
      scrollbar-width: thin;
      scrollbar-color: rgba(0,0,0,0.3) transparent;
    `;

    const style = document.createElement("style");
    style.textContent = `
      .katex-display-container::-webkit-scrollbar {
        height: 6px;
      }
      .katex-display-container::-webkit-scrollbar-track {
        background: transparent;
      }
      .katex-display-container::-webkit-scrollbar-thumb {
        background: rgba(0,0,0,0.3);
        border-radius: 3px;
      }
      .katex-display-container::-webkit-scrollbar-thumb:hover {
        background: rgba(0,0,0,0.5);
      }
    `;

    if (!document.head.querySelector("style[data-katex-scrollbar]")) {
      style.setAttribute("data-katex-scrollbar", "true");
      document.head.appendChild(style);
    }

    element.setAttribute("data-scrollbar-initialized", "true");
  });
}
