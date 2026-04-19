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
