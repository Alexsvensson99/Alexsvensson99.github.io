import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "js/analytics.js"), "utf8");

function eventTarget(extra = {}) {
  const listeners = {};
  return Object.assign(extra, {
    addEventListener(type, callback) { (listeners[type] ||= []).push(callback); },
    dispatch(type, event = {}) { for (const callback of listeners[type] || []) callback(event); }
  });
}

function makeButton() {
  return eventTarget({ focus() {}, getAttribute() { return null; } });
}

function harness({ stored = null, href = "https://www.svensson.design/tools/shotlattice/?secret=1#copy", referrer = "https://search.example/results?q=private#x" } = {}) {
  let storageValue = stored;
  const events = [];
  const scripts = [];
  const frameWindow = {};
  const frame = { contentWindow: frameWindow };
  const accept = makeButton();
  const reject = makeButton();
  const settings = makeButton();
  const banner = {
    hidden: true,
    querySelector(selector) {
      if (selector === "[data-consent-accept]") return accept;
      if (selector === "[data-consent-reject]") return reject;
      return null;
    }
  };
  const document = eventTarget({
    readyState: "loading",
    referrer,
    documentElement: { lang: "en" },
    head: { appendChild(node) { scripts.push(node); } },
    body: { appendChild() {} },
    createElement(tag) { return { tagName: tag, setAttribute() {}, querySelector() { return null; } }; },
    querySelector(selector) {
      if (selector === "[data-consent-banner]") return banner;
      if (selector === 'iframe[data-product-demo="shotlattice"]') return frame;
      return null;
    },
    querySelectorAll(selector) {
      if (selector === "[data-consent-accept]") return [accept];
      if (selector === "[data-consent-reject]") return [reject];
      if (selector === "[data-consent-settings]") return [settings];
      return [];
    }
  });
  const parsed = new URL(href);
  const window = eventTarget({
    document,
    URL,
    location: {
      href,
      origin: parsed.origin,
      hostname: parsed.hostname,
      pathname: parsed.pathname,
      protocol: parsed.protocol
    },
    localStorage: {
      getItem(key) { assert.equal(key, "svensson-analytics-consent"); return storageValue; },
      setItem(key, value) { assert.equal(key, "svensson-analytics-consent"); storageValue = value; }
    },
    __svenssonAnalyticsTestSink(name, parameters) { events.push({ name, parameters }); }
  });
  const context = vm.createContext({ window, document, URL, console, encodeURIComponent, Date });
  vm.runInContext(source, context);
  document.dispatch("DOMContentLoaded");
  return { window, document, banner, accept, reject, settings, events, scripts, frameWindow, stored: () => storageValue };
}

test("nothing is queued or emitted before an explicit acceptance", () => {
  const h = harness();
  assert.equal(h.banner.hidden, false);
  assert.deepEqual(h.events, []);
  assert.equal(h.window.dataLayer, undefined);
  assert.equal(h.scripts.length, 0);

  h.reject.dispatch("click");
  assert.equal(h.stored(), "rejected");
  assert.deepEqual(h.events, []);
  assert.equal(h.window["ga-disable-G-HT5Y0FFG8L"], true);
});

test("acceptance emits a sanitized page view and revocation stops later events", () => {
  const h = harness();
  h.accept.dispatch("click");
  assert.equal(h.stored(), "accepted");
  assert.deepEqual(JSON.parse(JSON.stringify(h.events)), [{
    name: "page_view",
    parameters: {
      page_location: "https://www.svensson.design/tools/shotlattice/",
      page_referrer: "https://search.example/results"
    }
  }]);

  assert.equal(h.window.SvenssonAnalytics.trackDemoStart("shotlattice"), true);
  h.window.SvenssonAnalytics.setConsent("rejected");
  assert.equal(h.window["ga-disable-G-HT5Y0FFG8L"], true);
  assert.equal(h.window.SvenssonAnalytics.trackDemoStart("shotlattice"), false);
  assert.equal(h.events.length, 2);
});

test("saved consent reloads without replaying denied interactions", () => {
  const rejected = harness({ stored: "rejected" });
  assert.deepEqual(rejected.events, []);
  assert.equal(rejected.banner.hidden, true);

  const accepted = harness({ stored: "accepted" });
  assert.equal(accepted.events.length, 1);
  assert.equal(accepted.events[0].name, "page_view");
});

test("cross-tab storage changes grant and revoke immediately", () => {
  const h = harness({ stored: "rejected" });
  h.window.dispatch("storage", { key: "svensson-analytics-consent", newValue: "accepted" });
  assert.equal(h.events[0].name, "page_view");
  h.window.dispatch("storage", { key: "svensson-analytics-consent", newValue: "rejected" });
  assert.equal(h.window["ga-disable-G-HT5Y0FFG8L"], true);
  assert.equal(h.window.SvenssonAnalytics.trackDemoStart("shotlattice"), false);
  h.window.dispatch("storage", { key: null, newValue: null });
  assert.equal(h.window.SvenssonAnalytics.getConsent(), null);
  assert.equal(h.banner.hidden, false);
});

test("demo start messages require consent, same origin, and the expected iframe", () => {
  const h = harness();
  const message = { type: "svensson-demo-start", product: "shotlattice" };
  h.window.dispatch("message", { source: h.frameWindow, origin: h.window.location.origin, data: message });
  assert.deepEqual(h.events, []);
  h.accept.dispatch("click");
  h.window.dispatch("message", { source: {}, origin: h.window.location.origin, data: message });
  h.window.dispatch("message", { source: h.frameWindow, origin: "https://evil.example", data: message });
  assert.equal(h.events.length, 1);
  h.window.dispatch("message", { source: h.frameWindow, origin: h.window.location.origin, data: message });
  h.window.dispatch("message", { source: h.frameWindow, origin: h.window.location.origin, data: message });
  assert.deepEqual(h.events.map(event => event.name), ["page_view", "demo_start"]);
});

function link(href, closest = () => null, attributes = {}) {
  return {
    href,
    closest,
    getAttribute(name) { return attributes[name] || null; }
  };
}

test("click classification uses bounded products, destinations, and placements", () => {
  const h = harness({ stored: "rejected", href: "https://www.svensson.design/tools/shotlattice/" });
  const api = h.window.SvenssonAnalytics;
  assert.deepEqual(
    JSON.parse(JSON.stringify(api.classifyLink(link("https://www.svensson.design/tools/brieflattice/?private=yes", selector => selector.includes("article") ? {} : null)))),
    { name: "product_click", parameters: { product: "brieflattice", placement: "card" } }
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(api.classifyLink(link("https://www.svensson.design/verktyg/overlayhearth/")))),
    { name: "product_click", parameters: { product: "overlayhearth", placement: "other" } }
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(api.classifyLink(link("https://www.svensson.design/apps/perfeggtion/", selector => selector.includes("app-card") ? {} : null)))),
    { name: "product_click", parameters: { product: "perfeggtion", placement: "card" } }
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(api.classifyLink(link("https://apps.apple.com/se/app/perfeggtion/id6757096463", selector => selector.includes("app-hero") ? {} : null)))),
    { name: "outbound_click", parameters: { destination: "app_store", product: "perfeggtion", placement: "hero" } }
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(api.classifyLink(link("https://apps.apple.com/se/app/bokstavsbrus/id6757083326", selector => selector.includes("app-aside") ? {} : null)))),
    { name: "outbound_click", parameters: { destination: "app_store", product: "bokstavsbrus", placement: "details" } }
  );
  assert.equal(api.classifyLink(link("https://apps.apple.com/se/app/unknown/id1234567890")), null);
  assert.deepEqual(
    JSON.parse(JSON.stringify(api.classifyLink(link("https://itsjustmeal3x.gumroad.com/l/shotlattice?utm_content=user-text")))),
    { name: "outbound_click", parameters: { destination: "gumroad", product: "shotlattice", placement: "other" } }
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(api.classifyLink(link("https://www.svensson.design/prova/shotlattice/?draft=secret")))),
    { name: "demo_open", parameters: { product: "shotlattice", placement: "other" } }
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(api.classifyLink(link("https://www.svensson.design/PkgLift/")))),
    { name: "product_click", parameters: { product: "pkglift", placement: "other" } }
  );
  assert.equal(api.classifyLink(link("https://evil.example/PkgLift/")), null);
  assert.equal(api.classifyLink(link("https://evil.example/l/shotlattice")), null);
  assert.equal(api.classifyLink(link("https://itsjustmeal3x.gumroad.com/l/not-allowed")), null);
});

test("localhost acceptance uses the test sink and never creates a network script", () => {
  const h = harness({ stored: "accepted", href: "http://localhost:8000/?private=1" });
  assert.equal(h.events[0].name, "page_view");
  assert.equal(h.events[0].parameters.page_location, "http://localhost:8000/");
  assert.equal(h.scripts.length, 0);
  assert.equal(h.window.dataLayer, undefined);
});

test("blocked storage still permits an explicit in-memory choice", () => {
  const h = harness();
  h.window.localStorage.setItem = () => { throw new Error("blocked"); };
  h.accept.dispatch("click");
  assert.equal(h.window.SvenssonAnalytics.getConsent(), "accepted");
  assert.equal(h.events[0].name, "page_view");
});
