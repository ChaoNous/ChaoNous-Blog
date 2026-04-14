export function getHeadingsFromContainer(containerId) {
    const container = document.getElementById(containerId);
    if (!container)
        return [];
    return Array.from(container.querySelectorAll("h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]"));
}
export function getMinLevel(headings) {
    let minLevel = 6;
    headings.forEach((heading) => {
        const level = typeof heading.depth === "number"
            ? heading.depth
            : parseInt(heading.tagName[1]);
        if (level < minLevel)
            minLevel = level;
    });
    return minLevel;
}
export function updateActiveHeading(headings, tocItems, scrollY, offsetTop = 150) {
    let activeIndex = -1;
    for (let i = 0; i < headings.length; i++) {
        const heading = headings[i];
        if (heading.getBoundingClientRect().top + scrollY < scrollY + offsetTop) {
            activeIndex = i;
        }
        else {
            break;
        }
    }
    tocItems.forEach((item, index) => {
        item.classList.toggle("active", index === activeIndex);
    });
    return activeIndex;
}
export function headingsToData(headings) {
    return headings.map((heading) => ({
        depth: parseInt(heading.tagName[1]),
        slug: heading.id,
        text: (heading.textContent || "").replace(/#+\s*$/, ""),
    }));
}
