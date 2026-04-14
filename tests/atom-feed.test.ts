import assert from "node:assert/strict";
import test from "node:test";
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
