import { test } from "node:test";
import assert from "node:assert/strict";

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

test("escapeHtml escapes unsafe chars", () => {
  const input = "<div id=\"x\">& ' </div>";
  const output = escapeHtml(input);
  assert.equal(output, "&lt;div id=&quot;x&quot;&gt;&amp; &#39; &lt;/div&gt;");
});
