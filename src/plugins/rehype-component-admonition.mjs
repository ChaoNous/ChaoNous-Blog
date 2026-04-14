import { h } from "hastscript";
export function AdmonitionComponent(properties, children, type) {
    if (!Array.isArray(children) || children.length === 0)
        return h("div", { class: "hidden" }, 'Invalid admonition directive. (Admonition directives must be of block type ":::note{name="name"} <content> :::")');
    let label = null;
    if (properties?.["has-directive-label"]) {
        label = children[0];
        children = children.slice(1);
        label.tagName = "div";
    }
    return h("blockquote", { class: `admonition bdm-${type}` }, [
        h("span", { class: "bdm-title" }, label ? label : type.toUpperCase()),
        ...children,
    ]);
}
