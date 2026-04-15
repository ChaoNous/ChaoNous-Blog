import { registerPageScript } from "./page-lifecycle.ts";

const ARCHIVE_PANEL_SELECTOR = "#archive-panel";
const ARCHIVE_GROUP_SELECTOR = "[data-archive-group]";
const ARCHIVE_POST_SELECTOR = "[data-archive-post]";
const ARCHIVE_COUNT_SELECTOR = "[data-archive-count]";
const ARCHIVE_EMPTY_SELECTOR = "[data-archive-empty]";

function getCountText(count: number, singular: string, plural: string) {
  return `${count}${count === 1 ? singular : plural}`;
}

function getSelectedCategories(searchParams: URLSearchParams) {
  return searchParams
    .getAll("category")
    .map((category) => category.trim())
    .filter((category) => category !== "");
}

function shouldShowPost(
  postElement: HTMLElement,
  selectedCategories: string[],
  showUncategorized: boolean,
) {
  const category = postElement.dataset.category?.trim() ?? "";
  const isUncategorized = postElement.dataset.uncategorized === "true";

  let isVisible = true;

  if (selectedCategories.length > 0) {
    isVisible =
      category !== "" && selectedCategories.includes(category);
  }

  if (showUncategorized) {
    isVisible = isVisible && isUncategorized;
  }

  return isVisible;
}

function restoreArchivePanel(panel: HTMLElement) {
  const singular = panel.dataset.postCountLabel ?? "post";
  const plural = panel.dataset.postsCountLabel ?? "posts";
  const emptyState = panel.querySelector<HTMLElement>(ARCHIVE_EMPTY_SELECTOR);
  const groups = panel.querySelectorAll<HTMLElement>(ARCHIVE_GROUP_SELECTOR);

  groups.forEach((group) => {
    const posts = group.querySelectorAll<HTMLElement>(ARCHIVE_POST_SELECTOR);
    const countElement = group.querySelector<HTMLElement>(ARCHIVE_COUNT_SELECTOR);

    group.classList.remove("hidden");
    posts.forEach((post) => {
      post.classList.remove("hidden");
    });

    if (countElement) {
      countElement.textContent = getCountText(posts.length, singular, plural);
    }
  });

  emptyState?.classList.add("hidden");
}

registerPageScript("archive-panel", {
  shouldRun() {
    return document.querySelector(ARCHIVE_PANEL_SELECTOR) !== null;
  },
  init() {
    const panel = document.querySelector<HTMLElement>(ARCHIVE_PANEL_SELECTOR);

    if (!panel) {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const selectedCategories = getSelectedCategories(searchParams);
    const showUncategorized = searchParams.get("uncategorized") !== null;
    const hasFilters = selectedCategories.length > 0 || showUncategorized;

    if (!hasFilters) {
      restoreArchivePanel(panel);
      return () => {
        restoreArchivePanel(panel);
      };
    }

    const singular = panel.dataset.postCountLabel ?? "post";
    const plural = panel.dataset.postsCountLabel ?? "posts";
    const emptyState = panel.querySelector<HTMLElement>(ARCHIVE_EMPTY_SELECTOR);
    const groups = panel.querySelectorAll<HTMLElement>(ARCHIVE_GROUP_SELECTOR);

    let visibleGroupCount = 0;

    groups.forEach((group) => {
      const posts = group.querySelectorAll<HTMLElement>(ARCHIVE_POST_SELECTOR);
      const countElement = group.querySelector<HTMLElement>(ARCHIVE_COUNT_SELECTOR);

      let visiblePostCount = 0;

      posts.forEach((post) => {
        const isVisible = shouldShowPost(
          post,
          selectedCategories,
          showUncategorized,
        );

        post.classList.toggle("hidden", !isVisible);

        if (isVisible) {
          visiblePostCount += 1;
        }
      });

      if (countElement) {
        countElement.textContent = getCountText(
          visiblePostCount,
          singular,
          plural,
        );
      }

      const showGroup = visiblePostCount > 0;
      group.classList.toggle("hidden", !showGroup);

      if (showGroup) {
        visibleGroupCount += 1;
      }
    });

    emptyState?.classList.toggle("hidden", visibleGroupCount > 0);

    return () => {
      restoreArchivePanel(panel);
    };
  },
});
