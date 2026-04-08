import { registerPageScript } from "./page-lifecycle";

const analyticsVisitorStorageKey = "chaonous:analytics-visitor-id";

function getVisitorId(): string {
  try {
    const existing = window.localStorage.getItem(analyticsVisitorStorageKey);
    if (existing) {
      return existing;
    }

    const next =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    window.localStorage.setItem(analyticsVisitorStorageKey, next);
    return next;
  } catch (error) {
    console.warn("analytics visitor id unavailable:", error);
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

function generateStatsText(
  container: HTMLElement,
  pageViews: number,
  visits: number,
): string {
  const pageViewsText = container.dataset.pageViewsLabel || "Views";
  const visitsText = container.dataset.visitsLabel || "Visits";
  return `${pageViewsText} ${pageViews} · ${visitsText} ${visits}`;
}

async function recordPageVisit(container: HTMLElement): Promise<void> {
  const postSlug = container.dataset.postSlug;
  const postUrl = container.dataset.postUrl;
  const postTitle = container.dataset.postTitle || "";
  if (!postSlug || !postUrl) {
    return;
  }

  await fetch("/api/analytics/visit", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      postSlug,
      postUrl,
      postTitle,
      visitorId: getVisitorId(),
    }),
  });
}

async function readPageStats(
  container: HTMLElement,
): Promise<{ pageviews?: number; visits?: number } | null> {
  const postSlug = container.dataset.postSlug;
  if (!postSlug) {
    return null;
  }

  const response = await fetch(
    `/api/analytics/pv?postSlug=${encodeURIComponent(postSlug)}`,
  );
  if (!response.ok) {
    throw new Error(`analytics status ${response.status}`);
  }

  return response.json();
}

async function fetchPageViews(): Promise<void> {
  const container = document.querySelector(".site-page-views");
  if (!(container instanceof HTMLElement)) {
    return;
  }

  try {
    await recordPageVisit(container);
    const stats = await readPageStats(container);
    const pageViews = stats?.pageviews || 0;
    const visits = stats?.visits || 0;

    container.classList.remove("hidden");
    container.querySelectorAll(".page-views-display").forEach((element) => {
      element.textContent = generateStatsText(container, pageViews, visits);
    });
  } catch (error) {
    console.error("Error fetching page views:", error);
    container.classList.add("hidden");
  }
}

registerPageScript("post-meta-page-views", {
  shouldRun() {
    return document.querySelector(".site-page-views") !== null;
  },
  init() {
    void fetchPageViews();
  },
});
