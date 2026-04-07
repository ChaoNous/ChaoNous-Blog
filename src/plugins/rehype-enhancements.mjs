import { visit } from "unist-util-visit";

/** Wrap tables in a scrollable div for responsive layouts. */
export function rehypeWrapTable() {
  return (tree) => {
    visit(tree, "element", (node, index, parent) => {
      if (node.tagName === "table" && parent) {
        parent.children[index] = {
          type: "element",
          tagName: "div",
          properties: { className: ["table-wrapper"] },
          children: [node],
        };
      }
    });
  };
}

/** Parse `w-NN%` from image alt text and apply as centered width. */
export function rehypeImageWidth() {
  const regex = / w-([0-9]+)%/;

  return (tree) => {
    visit(tree, "element", (node, index, parent) => {
      if (node.tagName === "img" && node.properties?.alt) {
        const match = node.properties.alt.match(regex);
        if (!match) return;

        const width = match[1];
        node.properties.alt = node.properties.alt.replace(regex, "").trim();
        node.properties.width = `${width}%`;
        node.properties.style = "display: block; margin: 0 auto;";

        const figureChildren = [node];

        if (node.properties.title) {
          figureChildren.push({
            type: "element",
            tagName: "figcaption",
            properties: {
              style:
                "text-align: center; margin-top: 0.5em; font-size: 0.9em; color: #666;",
            },
            children: [{ type: "text", value: node.properties.title }],
          });
        }

        if (parent && index !== undefined) {
          parent.children[index] = {
            type: "element",
            tagName: "figure",
            properties: { style: "margin: 1em 0;" },
            children: figureChildren,
          };
        }
      }
    });
  };
}
