import katex from "katex";
import { marked } from "marked";
import { parse as htmlParser } from "node-html-parser";

type FeedMathReplacement = {
  token: string;
  html: string;
  block: boolean;
};

function renderMathHtml(source: string, displayMode: boolean): string {
  return katex.renderToString(source.trim(), {
    displayMode,
    output: "htmlAndMathml",
    throwOnError: false,
  });
}

function extractFeedMath(content: string): {
  markdown: string;
  replacements: FeedMathReplacement[];
} {
  const replacements: FeedMathReplacement[] = [];
  let index = 0;
  let markdown = content.replace(
    /\$\$([\s\S]+?)\$\$/g,
    (_, expression: string) => {
      const token = `CNCFEEDBLOCKMATH${index++}TOKEN`;
      replacements.push({
        token,
        html: renderMathHtml(expression, true),
        block: true,
      });
      return `\n\n${token}\n\n`;
    },
  );

  markdown = markdown.replace(
    /\$(?![\s\d])((?:\\.|[^$\n])+?)\$/g,
    (_, expression: string) => {
      const token = `CNCFEEDINLINEMATH${index++}TOKEN`;
      replacements.push({
        token,
        html: renderMathHtml(expression, false),
        block: false,
      });
      return token;
    },
  );

  return { markdown, replacements };
}

function restoreFeedMath(
  html: string,
  replacements: FeedMathReplacement[],
): string {
  let output = html;

  for (const replacement of replacements) {
    if (replacement.block) {
      output = output.replace(
        new RegExp(`<p>${replacement.token}</p>`, "g"),
        replacement.html,
      );
    }

    output = output.replaceAll(replacement.token, replacement.html);
  }

  return output;
}

export function sanitizeFeedHtml(html: string): string {
  const root = htmlParser.parse(html, {
    comment: true,
  });

  root.querySelectorAll("script").forEach((element) => {
    element.remove();
  });

  root.childNodes.forEach((node) => {
    if (node.nodeType === 8) {
      node.remove();
    }
  });

  root.querySelectorAll("*").forEach((element) => {
    for (const [name, rawValue] of Object.entries(element.attributes)) {
      const value = String(rawValue || "");
      if (/^on/i.test(name)) {
        element.removeAttribute(name);
        continue;
      }

      if (
        (name === "href" || name === "src") &&
        /^\s*javascript:/i.test(value)
      ) {
        element.removeAttribute(name);
      }
    }
  });

  return root.toString();
}

export function renderFeedMarkdown(content: string | undefined): string {
  const source = String(content ?? "");
  const extracted = extractFeedMath(source);
  const rendered = marked.parse(extracted.markdown, {
    async: false,
    gfm: true,
  });
  const html = typeof rendered === "string" ? rendered : String(rendered ?? "");

  return sanitizeFeedHtml(restoreFeedMath(html, extracted.replacements));
}
