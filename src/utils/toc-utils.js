/**
 * TOC 共享工具模块
 * 提供三个 TOC 组件（FloatingTOC、CardTOC、TOC）的共享逻辑
 */

export interface HeadingData {
  depth: number;
  slug: string;
  text: string;
}

/**
 * 获取页面中的所有标题元素
 */
export function getHeadingsFromContainer(containerId: string): HTMLElement[] {
  const container = document.getElementById(containerId);
  if (!container) return [];

  return Array.from(
    container.querySelectorAll("h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]")
  ) as HTMLElement[];
}

/**
 * 计算最小标题级别
 */
export function getMinLevel(headings: HTMLElement[] | HeadingData[]): number {
  let minLevel = 6;
  headings.forEach((h) => {
    const level = typeof h.depth === "number" ? h.depth : parseInt((h as HTMLElement).tagName[1]);
    if (level < minLevel) minLevel = level;
  });
  return minLevel;
}

/**
 * 生成 TOC HTML
 */
export function generateTOCHtml(
  headings: HeadingData[],
  minLevel: number,
  maxVisibleDepth: number,
  itemClass: string,
  badgeClass: string,
  dotClass: string,
  dotSmallClass: string,
  textClass: string
): string {
  let html = "";
  let h1Count = 0;

  headings.forEach((heading) => {
    if (heading.depth >= maxVisibleDepth) return;

    const indent = heading.depth - minLevel;
    const text = heading.text.replace(/#+\s*$/, "");
    let badge = "";

    if (heading.depth === minLevel) {
      h1Count++;
      badge = `<span class="${badgeClass}">${h1Count}</span>`;
    } else if (heading.depth === minLevel + 1) {
      badge = `<span class="${dotClass}"></span>`;
    } else {
      badge = `<span class="${dotSmallClass}"></span>`;
    }

    html += `<a href="#${heading.slug}" class="${itemClass}" style="padding-left: ${0.5 + indent}rem" data-level="${heading.depth - minLevel}">${badge}<span class="${textClass}">${text}</span></a>`;
  });

  return html;
}

/**
 * 根据滚动位置更新激活标题
 */
export function updateActiveHeading(
  headings: HTMLElement[],
  tocItems: HTMLElement[],
  scrollY: number,
  offsetTop: number = 150
): number {
  let activeIndex = -1;

  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    if (heading.getBoundingClientRect().top + scrollY < scrollY + offsetTop) {
      activeIndex = i;
    } else {
      break;
    }
  }

  tocItems.forEach((item, index) => {
    item.classList.toggle("active", index === activeIndex);
  });

  return activeIndex;
}

/**
 * 将 DOM 标题转换为 HeadingData 数组
 */
export function headingsToData(headings: HTMLElement[]): HeadingData[] {
  return headings.map((h) => ({
    depth: parseInt(h.tagName[1]),
    slug: h.id,
    text: (h.textContent || "").replace(/#+\s*$/, ""),
  }));
}