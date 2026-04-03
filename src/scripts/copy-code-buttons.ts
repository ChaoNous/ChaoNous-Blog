import { registerPageScript } from "./page-lifecycle.ts";

function extractCodeText(codeElement: HTMLElement): string {
  const lineElements = codeElement.querySelectorAll("span.line");
  if (lineElements.length > 0) {
    return Array.from(lineElements)
      .map((line) => line.textContent || "")
      .join("\n");
  }

  const codeFragments = codeElement.querySelectorAll(".code:not(summary *)");
  if (codeFragments.length > 0) {
    return Array.from(codeFragments)
      .map((fragment) => fragment.textContent || "")
      .join("\n");
  }

  return codeElement.textContent || "";
}

function normalizeCodeText(code: string): string {
  return code.replace(/\n{3,}/g, (match) => {
    const emptyLineCount = match.length - 1;
    const resultEmptyLines = Math.ceil(emptyLineCount / 2);
    return "\n".repeat(resultEmptyLines + 1);
  });
}

async function writeClipboardText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch (clipboardError) {
    console.warn(
      "[copy-code-buttons] Clipboard API failed. Falling back to execCommand.",
      clipboardError,
    );
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  textArea.style.top = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    document.execCommand("copy");
  } finally {
    document.body.removeChild(textArea);
  }
}

function handleCopyButtonClick(event: MouseEvent): void {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const button = target.closest(".copy-btn");
  if (!(button instanceof HTMLElement)) {
    return;
  }

  const codeElement = button.parentElement?.querySelector<HTMLElement>("code");
  if (!codeElement) {
    return;
  }

  const code = normalizeCodeText(extractCodeText(codeElement));

  void writeClipboardText(code)
    .then(() => {
      const timeoutId = button.getAttribute("data-timeout-id");
      if (timeoutId) {
        clearTimeout(Number.parseInt(timeoutId, 10));
      }

      button.classList.add("success");

      const newTimeoutId = window.setTimeout(() => {
        button.classList.remove("success");
      }, 1000);

      button.setAttribute("data-timeout-id", String(newTimeoutId));
    })
    .catch((error) => {
      console.error("[copy-code-buttons] Copy failed:", error);
    });
}

registerPageScript("copy-code-buttons", {
  shouldRun() {
    return document.querySelector(".copy-btn") !== null;
  },
  init() {
    document.addEventListener("click", handleCopyButtonClick);

    return () => {
      document.removeEventListener("click", handleCopyButtonClick);
    };
  },
});
