/**
 * TOC 共享工具模块
 * 提供三个 TOC 组件（FloatingTOC、CardTOC、TOC）的共享逻辑
 */

/**
 * 获取页面中的所有标题元素
 */
export function getHeadingsFromContainer(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return [];

  return Array.from(
    container.querySelectorAll("h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]")
  );
}

/**
 * 计算最小标题级别
 */
export function getMinLevel(headings) {
  let minLevel = 6;
  headings.forEach((h) => {
    const level = typeof h.depth === "number" ? h.depth : parseInt(h.tagName[1]);
    if (level < minLevel) minLevel = level;
  });
  return minLevel;
}

/**
 * 根据滚动位置更新激活标题
 */
export function updateActiveHeading(headings, tocItems, scrollY, offsetTop = 150) {
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
 * 将 DOM 标题转换为数据数组
 */
export function headingsToData(headings) {
  return headings.map((h) => ({
    depth: parseInt(h.tagName[1]),
    slug: h.id,
    text: (h.textContent || "").replace(/#+\s*$/, ""),
  }));
}