(function () {
    "use strict";

    var measurementId = "G-HT5Y0FFG8L";
    var storageKey = "svensson-analytics-consent";
    var allowedProducts = {
        brieflattice: true,
        captionweave: true,
        bokstavsbrus: true,
        overlayhearth: true,
        perfeggtion: true,
        relayfolio: true,
        shotlattice: true,
        tendercairn: true
    };
    var gumroadProducts = {
        brieflattice: "brieflattice",
        captionweave: "captionweave",
        overlayhearth: "overlayhearth",
        relayfolio: "relayfolio",
        shotlattice: "shotlattice",
        tendercairn: "tendercairn"
    };
    var appStoreProducts = {
        "6757083326": "bokstavsbrus",
        "6757096463": "perfeggtion"
    };
    var consent = null;
    var pageViewSent = false;
    var demoStarted = false;

    function each(nodes, callback) {
        Array.prototype.forEach.call(nodes || [], callback);
    }

    function readConsent() {
        try {
            var value = window.localStorage.getItem(storageKey);
            return value === "accepted" || value === "rejected" ? value : null;
        } catch (error) {
            return null;
        }
    }

    function saveConsent(value) {
        try {
            window.localStorage.setItem(storageKey, value);
        } catch (error) {
            return false;
        }
        return true;
    }

    function isNetworkAllowed() {
        var hostname = window.location.hostname.toLowerCase();
        return window.location.protocol === "https:" &&
            (hostname === "www.svensson.design" || hostname === "svensson.design");
    }

    function cleanUrl(value, base) {
        try {
            var url = new URL(value, base || window.location.href);
            return url.origin === "null" ? url.pathname : url.origin + url.pathname;
        } catch (error) {
            return "";
        }
    }

    function pageParameters() {
        var parameters = { page_location: cleanUrl(window.location.href) };
        var referrer = cleanUrl(document.referrer);
        if (referrer) {
            parameters.page_referrer = referrer;
        }
        return parameters;
    }

    function emit(name, parameters) {
        if (consent !== "accepted") {
            return false;
        }
        if (typeof window.__svenssonAnalyticsTestSink === "function") {
            window.__svenssonAnalyticsTestSink(name, parameters || {});
            return true;
        }
        if (!isNetworkAllowed() || typeof window.gtag !== "function") {
            return false;
        }
        window.gtag("event", name, parameters || {});
        return true;
    }

    function sendPageView() {
        if (!pageViewSent && emit("page_view", pageParameters())) {
            pageViewSent = true;
        }
    }

    function loadAnalytics() {
        var script;
        var safePage;
        window["ga-disable-" + measurementId] = false;

        if (typeof window.__svenssonAnalyticsTestSink === "function") {
            sendPageView();
            return;
        }
        if (!isNetworkAllowed()) {
            return;
        }
        if (!window.__svenssonAnalyticsLoaded) {
            window.__svenssonAnalyticsLoaded = true;
            window.dataLayer = window.dataLayer || [];
            window.gtag = function () {
                window.dataLayer.push(arguments);
            };
            window.gtag("consent", "default", {
                ad_storage: "denied",
                ad_user_data: "denied",
                ad_personalization: "denied",
                analytics_storage: "granted"
            });
            window.gtag("js", new Date());
            safePage = pageParameters();
            window.gtag("config", measurementId, {
                allow_google_signals: false,
                allow_ad_personalization_signals: false,
                anonymize_ip: true,
                page_location: safePage.page_location,
                page_referrer: safePage.page_referrer || "",
                send_page_view: false
            });
            script = document.createElement("script");
            script.async = true;
            script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(measurementId);
            document.head.appendChild(script);
        } else if (typeof window.gtag === "function") {
            window.gtag("consent", "update", { analytics_storage: "granted" });
        }
        sendPageView();
    }

    function stopAnalytics() {
        window["ga-disable-" + measurementId] = true;
        if (typeof window.gtag === "function") {
            window.gtag("consent", "update", { analytics_storage: "denied" });
        }
    }

    function language() {
        return String(document.documentElement.lang || "sv").toLowerCase().indexOf("en") === 0 ? "en" : "sv";
    }

    function createBanner() {
        var banner = document.querySelector("[data-consent-banner]");
        var copy;
        if (banner) {
            return banner;
        }
        copy = language() === "en" ? {
            title: "Optional visitor statistics",
            body: "Google Analytics is used only if you accept. The site works the same if you decline.",
            accept: "Accept statistics",
            reject: "No thanks"
        } : {
            title: "Valfri besöksstatistik",
            body: "Google Analytics används endast om du godkänner det. Sidan fungerar likadant om du tackar nej.",
            accept: "Godkänn statistik",
            reject: "Nej tack"
        };
        banner = document.createElement("div");
        banner.className = "consent-banner";
        banner.hidden = true;
        banner.setAttribute("role", "dialog");
        banner.setAttribute("aria-modal", "false");
        banner.setAttribute("aria-labelledby", "analytics-consent-title");
        banner.setAttribute("aria-describedby", "analytics-consent-description");
        banner.setAttribute("data-consent-banner", "");
        banner.innerHTML = "<div><strong id=\"analytics-consent-title\"></strong><p id=\"analytics-consent-description\"></p></div>" +
            "<div class=\"consent-actions\"><button class=\"button button-primary\" type=\"button\" data-consent-accept></button>" +
            "<button class=\"button button-quiet\" type=\"button\" data-consent-reject></button></div>";
        banner.querySelector("strong").textContent = copy.title;
        banner.querySelector("p").textContent = copy.body;
        var privacyLink = document.createElement("a");
        privacyLink.href = "https://policies.google.com/privacy";
        privacyLink.target = "_blank";
        privacyLink.rel = "noopener noreferrer";
        privacyLink.textContent = language() === "en" ? "Read Google's privacy policy." : "Läs Googles integritetspolicy.";
        banner.querySelector("p").appendChild(document.createTextNode(" "));
        banner.querySelector("p").appendChild(privacyLink);
        banner.querySelector("[data-consent-accept]").textContent = copy.accept;
        banner.querySelector("[data-consent-reject]").textContent = copy.reject;
        document.body.appendChild(banner);
        return banner;
    }

    function openBanner() {
        var banner = createBanner();
        banner.hidden = false;
        var button = banner.querySelector("[data-consent-accept]");
        if (button && typeof button.focus === "function") {
            button.focus();
        }
    }

    function closeBanner() {
        var banner = document.querySelector("[data-consent-banner]");
        if (banner) {
            banner.hidden = true;
        }
    }

    function setConsent(value) {
        if (value !== "accepted" && value !== "rejected") {
            return;
        }
        consent = value;
        saveConsent(value);
        closeBanner();
        if (value === "accepted") {
            loadAnalytics();
        } else {
            stopAnalytics();
        }
    }

    function productFromPath(pathname) {
        var match = String(pathname || "").match(/^\/(?:tools|verktyg|apps)\/([a-z0-9-]+)\/?$/);
        return match && allowedProducts[match[1]] ? match[1] : "";
    }

    function placementFor(link) {
        if (link.getAttribute("data-analytics-placement")) {
            var explicit = link.getAttribute("data-analytics-placement");
            if (/^(hero|card|details|navigation|footer)$/.test(explicit)) return explicit;
        }
        if (link.closest && link.closest(".hero,.product-hero,.featured-tool,.app-hero")) return "hero";
        if (link.closest && link.closest(".purchase-panel,.app-aside")) return "details";
        if (link.closest && link.closest("article,.tool-card,.guide-card,.discovery-card,.app-card")) return "card";
        if (link.closest && link.closest("nav")) return "navigation";
        if (link.closest && link.closest("footer")) return "footer";
        return "other";
    }

    function classifyLink(link) {
        var url;
        try {
            url = new URL(link.href, window.location.href);
        } catch (error) {
            return null;
        }
        var placement = placementFor(link);
        var product;
        if (url.protocol === "https:" && url.hostname === "www.svensson.design" && url.pathname === "/PkgLift/") {
            return { name: "product_click", parameters: { product: "pkglift", placement: placement } };
        }
        if (url.origin === window.location.origin) {
            if (/^\/prova\/shotlattice\/?$/.test(url.pathname) || /^\/tools\/shotlattice\/demo\/?$/.test(url.pathname)) {
                return { name: "demo_open", parameters: { product: "shotlattice", placement: placement } };
            }
            product = productFromPath(url.pathname);
            return product ? { name: "product_click", parameters: { product: product, placement: placement } } : null;
        }
        if (url.hostname === "itsjustmeal3x.gumroad.com") {
            var gumroadMatch = url.pathname.match(/^\/l\/([a-z0-9-]+)\/?$/);
            product = gumroadMatch && gumroadProducts[gumroadMatch[1]];
            return product ? { name: "outbound_click", parameters: { destination: "gumroad", product: product, placement: placement } } : null;
        }
        if (url.hostname === "apps.apple.com") {
            var appStoreMatch = url.pathname.match(/\/id(\d+)\/?$/);
            product = appStoreMatch && appStoreProducts[appStoreMatch[1]];
            return product ? { name: "outbound_click", parameters: { destination: "app_store", product: product, placement: placement } } : null;
        }
        return null;
    }

    function setupClicks() {
        document.addEventListener("click", function (event) {
            var link = event.target && event.target.closest ? event.target.closest("a[href]") : null;
            var classified = link && classifyLink(link);
            if (classified) emit(classified.name, classified.parameters);
        });
    }

    function setupDemoMessages() {
        window.addEventListener("message", function (event) {
            var frame = document.querySelector('iframe[data-product-demo="shotlattice"]');
            if (demoStarted || consent !== "accepted" || !frame || !frame.contentWindow ||
                    event.source !== frame.contentWindow || event.origin !== window.location.origin ||
                    !event.data || event.data.type !== "svensson-demo-start" || event.data.product !== "shotlattice") {
                return;
            }
            if (emit("demo_start", { product: "shotlattice" })) demoStarted = true;
        });
    }

    function setupControls() {
        var banner = createBanner();
        each(document.querySelectorAll("[data-consent-accept]"), function (button) {
            if (button.classList) {
                button.classList.remove("button-primary", "button-quiet");
                button.classList.add("button-secondary");
            }
            button.addEventListener("click", function () { setConsent("accepted"); });
        });
        each(document.querySelectorAll("[data-consent-reject]"), function (button) {
            if (button.classList) {
                button.classList.remove("button-primary", "button-quiet");
                button.classList.add("button-secondary");
            }
            button.addEventListener("click", function () { setConsent("rejected"); });
        });
        each(document.querySelectorAll("[data-consent-settings]"), function (button) {
            button.addEventListener("click", openBanner);
        });
        consent = readConsent();
        if (consent === "accepted") loadAnalytics();
        else if (consent === "rejected") stopAnalytics();
        else banner.hidden = false;
    }

    function setupStorageSync() {
        window.addEventListener("storage", function (event) {
            if (event.key !== storageKey && event.key !== null) return;
            if (event.newValue === "accepted") {
                consent = "accepted";
                closeBanner();
                loadAnalytics();
            } else if (event.newValue === "rejected") {
                consent = "rejected";
                closeBanner();
                stopAnalytics();
            } else {
                consent = null;
                stopAnalytics();
                openBanner();
            }
        });
    }

    function init() {
        setupControls();
        setupClicks();
        setupDemoMessages();
        setupStorageSync();
    }

    window.SvenssonAnalytics = {
        classifyLink: classifyLink,
        cleanUrl: cleanUrl,
        getConsent: function () { return consent; },
        setConsent: setConsent,
        trackDemoStart: function (product) {
            if (product !== "shotlattice" || demoStarted) return false;
            if (emit("demo_start", { product: product })) {
                demoStarted = true;
                return true;
            }
            return false;
        }
    };

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
}());
