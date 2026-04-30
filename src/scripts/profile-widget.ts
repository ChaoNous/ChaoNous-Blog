import { registerPageScript } from "./page-lifecycle";

function scheduleIdleTask(callback: () => void, timeout = 1200): void {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(() => callback(), { timeout });
    return;
  }

  globalThis.setTimeout(callback, Math.min(timeout, 300));
}

class ProfileTypewriter {
  private element: HTMLElement;
  private texts: string[];
  private currentTextIndex = 0;
  private currentIndex = 0;
  private isDeleting = false;
  private timeoutId = 0;
  private speed: number;
  private deleteSpeed: number;
  private pauseTime: number;

  constructor(element: HTMLElement) {
    this.element = element;
    const textValue = element.dataset.text || "";

    try {
      const parsed = JSON.parse(textValue);
      this.texts = Array.isArray(parsed) ? parsed : [textValue];
    } catch {
      this.texts = [textValue];
    }

    this.speed = Number.parseInt(element.dataset.speed || "140", 10);
    this.deleteSpeed = Number.parseInt(element.dataset.deleteSpeed || "50", 10);
    this.pauseTime = Number.parseInt(element.dataset.pauseTime || "2000", 10);
  }

  private isEnabled(): boolean {
    return (
      this.element.dataset.speed !== undefined ||
      this.element.dataset.deleteSpeed !== undefined ||
      this.element.dataset.pauseTime !== undefined
    );
  }

  private getCurrentText(): string {
    return this.texts[this.currentTextIndex] || "";
  }

  private showRandomText(): void {
    const index = Math.floor(Math.random() * this.texts.length);
    this.element.textContent = this.texts[index] || "";
  }

  start(): void {
    if (this.texts.length > 1 && !this.isEnabled()) {
      this.showRandomText();
      return;
    }

    if (!this.isEnabled()) {
      this.element.textContent = this.getCurrentText();
      return;
    }

    if (this.texts.length === 0) {
      return;
    }

    this.element.textContent = "";
    this.type();
  }

  private type(): void {
    const currentText = this.getCurrentText();

    if (this.isDeleting) {
      if (this.currentIndex > 0) {
        this.currentIndex -= 1;
        this.element.textContent = currentText.substring(0, this.currentIndex);
        this.timeoutId = window.setTimeout(() => this.type(), this.deleteSpeed);
        return;
      }

      this.isDeleting = false;
      this.currentTextIndex = (this.currentTextIndex + 1) % this.texts.length;
      this.timeoutId = window.setTimeout(() => this.type(), this.speed);
      return;
    }

    if (this.currentIndex < currentText.length) {
      this.currentIndex += 1;
      this.element.textContent = currentText.substring(0, this.currentIndex);
      this.timeoutId = window.setTimeout(() => this.type(), this.speed);
      return;
    }

    if (this.texts.length > 1) {
      this.isDeleting = true;
      this.timeoutId = window.setTimeout(() => this.type(), this.pauseTime);
      return;
    }

    if (this.texts.length === 1 && this.texts[0] === "") {
      this.element.innerHTML = "&nbsp;";
    }
  }

  destroy(): void {
    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId);
    }
    this.element.textContent = this.getCurrentText();
  }
}

let activeTypewriters: ProfileTypewriter[] = [];
let scheduledInitVersion = 0;

function destroyTypewriters(): void {
  scheduledInitVersion += 1;
  activeTypewriters.forEach((instance) => instance.destroy());
  activeTypewriters = [];
}

function initTypewriters(): void {
  destroyTypewriters();
  document.querySelectorAll(".typewriter").forEach((element) => {
    if (!(element instanceof HTMLElement)) return;
    const instance = new ProfileTypewriter(element);
    activeTypewriters.push(instance);
    instance.start();
  });
}

function initTypewritersWhenIdle(): void {
  const initVersion = scheduledInitVersion + 1;
  scheduledInitVersion = initVersion;

  scheduleIdleTask(() => {
    if (initVersion !== scheduledInitVersion) {
      return;
    }

    if (document.querySelector(".typewriter")) {
      initTypewriters();
    }
  }, 1800);
}

registerPageScript("profile-bio-typewriter", {
  shouldRun() {
    return document.querySelector(".typewriter") !== null;
  },
  init() {
    initTypewritersWhenIdle();
    return () => {
      destroyTypewriters();
    };
  },
});
