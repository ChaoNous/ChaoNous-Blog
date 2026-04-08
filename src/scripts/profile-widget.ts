import { registerPageScript } from "./page-lifecycle";
import { scheduleIdleTask } from "./runtime-utils";

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

function destroyTypewriters(): void {
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
  scheduleIdleTask(() => {
    if (document.querySelector(".typewriter")) {
      initTypewriters();
    }
  }, 1800);
}

async function fetchSiteStats(container: HTMLElement): Promise<void> {
  const unavailableLabel = container.dataset.unavailableLabel || "Unavailable";
  const pageViewsLabel = container.dataset.pageViewsLabel || "Views";
  const visitsLabel = container.dataset.visitsLabel || "Visits";

  try {
    const response = await fetch("/api/analytics/site");
    if (!response.ok) {
      throw new Error(`analytics status ${response.status}`);
    }

    const stats = await response.json();
    const pageViews = stats.pageviews || 0;
    const visits = stats.visits || 0;

    if (pageViews === 0 && visits === 0) {
      container.classList.add("hidden");
      return;
    }

    container.classList.remove("hidden");
    document.querySelectorAll(".site-stats-display").forEach((element) => {
      element.textContent = `${pageViewsLabel} ${pageViews} · ${visitsLabel} ${visits}`;
    });
  } catch (error) {
    console.error("Error fetching site stats:", error);
    container.classList.remove("hidden");
    document.querySelectorAll(".site-stats-display").forEach((element) => {
      element.textContent = unavailableLabel;
    });
  }
}

function fetchSiteStatsWhenVisible(): () => void {
  const container = document.querySelector(".site-stats-container");
  if (!(container instanceof HTMLElement)) {
    return () => {};
  }

  let fetched = false;
  const runFetch = (): void => {
    if (fetched) return;
    fetched = true;
    scheduleIdleTask(() => {
      void fetchSiteStats(container);
    }, 2500);
  };

  if (!("IntersectionObserver" in window)) {
    runFetch();
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        runFetch();
        observer.disconnect();
      }
    },
    { rootMargin: "160px 0px" },
  );

  observer.observe(container);
  return () => observer.disconnect();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTypewritersWhenIdle, {
    once: true,
  });
} else {
  initTypewritersWhenIdle();
}

document.addEventListener("astro:page-load", initTypewritersWhenIdle);

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

registerPageScript("profile-site-stats", {
  shouldRun() {
    return document.querySelector(".site-stats-container") !== null;
  },
  init() {
    return fetchSiteStatsWhenVisible();
  },
});
