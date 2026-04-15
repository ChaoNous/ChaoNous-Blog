import assert from "node:assert/strict";
import test from "node:test";
import { renderFeedMarkdown } from "../src/utils/feed-html.ts";
import {
  escapeXmlAttribute,
  escapeXmlText,
  wrapInCdata,
} from "../src/utils/xml-utils.ts";

test("escapeXmlText escapes reserved XML characters in text nodes", () => {
  assert.equal(
    escapeXmlText(`Fish & Chips <Beta> "quote"`),
    `Fish &amp; Chips &lt;Beta&gt; "quote"`,
  );
});

test("escapeXmlAttribute escapes reserved XML characters in attributes", () => {
  assert.equal(
    escapeXmlAttribute(`https://example.com?a=1&b="two"'`),
    "https://example.com?a=1&amp;b=&quot;two&quot;&apos;",
  );
});

test("wrapInCdata splits nested CDATA terminators safely", () => {
  assert.equal(wrapInCdata("before ]]> after"), "before ]]]]><![CDATA[> after");
});

test("renderFeedMarkdown preserves author HTML and renders KaTeX", () => {
  const html = renderFeedMarkdown(`
<div id="btc-main-chart" style="height:240px"></div>

Inline math $\\sqrt{t}$ and block math:

$$x^2 + y^2 = z^2$$
`);

  assert.match(html, /<div id="btc-main-chart" style="height:240px"><\/div>/);
  assert.match(html, /class="katex"/);
  assert.doesNotMatch(html, /&lt;div id="btc-main-chart"/);
  assert.doesNotMatch(html, /\$\$x\^2/);
});

test("renderFeedMarkdown does not treat currency amounts as inline math", () => {
  const html = renderFeedMarkdown(
    "| Horizon | Price |\n| --- | --- |\n| 30 days | $71,861 |\n| 60 days | $60,933 |",
  );

  assert.match(html, /\$71,861/);
  assert.match(html, /\$60,933/);
  assert.doesNotMatch(html, /class="katex"/);
});

test("renderFeedMarkdown strips script tags and inline event handlers", () => {
  const html = renderFeedMarkdown(
    '<div onclick="alert(1)">safe</div><script>alert(1)</script><a href="javascript:alert(1)">bad</a>',
  );

  assert.equal(html, "<div>safe</div><a>bad</a>");
});
