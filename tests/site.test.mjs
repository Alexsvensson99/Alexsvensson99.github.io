import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const mainJs = fs.readFileSync(path.join(root, "js/main.js"), "utf8");
const dateUtils = require(path.join(root, "js/date-utils.js"));

function readJpegDimensions(buffer) {
  assert.equal(buffer.readUInt16BE(0), 0xffd8, "Social preview must be a JPEG");

  let offset = 2;
  const sizeMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

  while (offset + 8 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    offset += 2;

    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;

    const segmentLength = buffer.readUInt16BE(offset);
    if (sizeMarkers.has(marker)) {
      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5)
      };
    }

    offset += segmentLength;
  }

  throw new Error("Could not read JPEG dimensions");
}

test("date calculations work without Moment.js", () => {
  const august2026 = new Date(2026, 7, 23);

  assert.equal(dateUtils.monthsBetween("2023-06", "2024-03"), 9);
  assert.equal(dateUtils.durationBetween("2024-03", "current", august2026), "2 år 5 månader");
  assert.equal(dateUtils.formatDuration(1), "1 månad");
  assert.equal(dateUtils.formatDuration(12), "1 år");
  assert.equal(dateUtils.durationBetween("2024-13", "current", august2026), "");
  assert.equal(dateUtils.monthsBetween("2024-03", "2023-03"), null);
});

test("HTML ids are unique and in-page links resolve", () => {
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  const uniqueIds = new Set(ids);
  const anchors = [...html.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]);

  assert.equal(ids.length, uniqueIds.size, "Every id must be unique");
  for (const target of anchors) {
    assert.ok(uniqueIds.has(target), "Missing in-page target #" + target);
  }
});

test("all referenced local assets exist", () => {
  const references = [...html.matchAll(/(?:src|href)="((?:css|js|img)\/[^"?#]+)[^"\s]*"/g)]
    .map((match) => match[1]);

  for (const reference of references) {
    assert.ok(fs.existsSync(path.join(root, reference)), "Missing local asset " + reference);
  }
});

test("legacy browser dependencies and broken cookie script are gone", () => {
  const source = (html + "\n" + mainJs).toLowerCase();

  assert.doesNotMatch(source, /moment(?:\.min)?\.js/);
  assert.doesNotMatch(source, /bootstrap(?:\.bundle)?(?:\.min)?\.(?:css|js)/);
  assert.doesNotMatch(source, /eucookie/);
  assert.doesNotMatch(source, /fontawesome/);
  assert.doesNotMatch(source, /fonts\.googleapis/);
  assert.doesNotMatch(source, /integrity="sha384-\.\.\."/);
});

test("privacy-sensitive structured metadata was minimized", () => {
  assert.doesNotMatch(html, /streetAddress/);
  assert.doesNotMatch(html, /birthDate/);
  assert.match(html, /data-consent-banner/);
  assert.match(mainJs, /analytics_storage: "granted"/);
  assert.match(mainJs, /readConsent\(\) === "accepted"/);
  assert.match(html, /https:\/\/policies\.google\.com\/privacy/);
});

test("SEO metadata and structured data use the canonical HTTPS URL", () => {
  const structuredDataMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);

  assert.ok(structuredDataMatch, "Structured data block must exist");
  assert.doesNotMatch(html, /http:\/\//);
  assert.match(html, /rel="canonical" href="https:\/\/www\.svensson\.design\/"/);
  assert.equal(JSON.parse(structuredDataMatch[1]).url, "https://www.svensson.design/");

  const previewDimensions = readJpegDimensions(fs.readFileSync(path.join(root, "img/og-image.jpg")));
  assert.deepEqual(previewDimensions, { width: 1200, height: 630 });
});

test("CV and contact essentials are present and accessible", () => {
  assert.match(html, /PkgLift/);
  assert.match(html, /Swift Package Manager/);
  assert.match(html, /role="status" aria-live="polite"/);
  assert.match(html, /aria-controls="primary-navigation"/);
  assert.match(html, /CV senast uppdaterat/);
  assert.match(html, /https:\/\/www\.stenungsund\.se\/gymnasiet\/nosnasgymnasiet\/utbildningar\/teknikprogrammet/);
});

test("removed hero claims do not return", () => {
  assert.doesNotMatch(html, /Jag får teknik, människor och leveranser att fungera tillsammans/);
  assert.doesNotMatch(html, /hero-facts/);
  assert.doesNotMatch(html, /medarbetare i teamet/);
  assert.doesNotMatch(html, /kommuner i leveransen/);
});
