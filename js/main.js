(function () {
    "use strict";

    document.documentElement.classList.add("js");

    function forEachNode(nodes, callback) {
        Array.prototype.forEach.call(nodes, callback);
    }

    function setupNavigation() {
        var button = document.querySelector("[data-menu-toggle]");
        var navigation = document.querySelector("[data-navigation]");
        var links;

        if (!button || !navigation) {
            return;
        }

        links = navigation.querySelectorAll("a");

        function closeMenu(returnFocus) {
            button.setAttribute("aria-expanded", "false");
            navigation.classList.remove("is-open");

            if (returnFocus) {
                button.focus();
            }
        }

        button.addEventListener("click", function () {
            var shouldOpen = button.getAttribute("aria-expanded") !== "true";
            button.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
            navigation.classList.toggle("is-open", shouldOpen);
        });

        forEachNode(links, function (link) {
            link.addEventListener("click", function () {
                closeMenu(false);
            });
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && button.getAttribute("aria-expanded") === "true") {
                closeMenu(true);
            }
        });

        window.addEventListener("resize", function () {
            if (window.innerWidth > 860) {
                closeMenu(false);
            }
        });
    }

    function setupDurations() {
        var elements = document.querySelectorAll("[data-duration]");

        if (!window.SvenssonDate) {
            return;
        }

        forEachNode(elements, function (element) {
            var duration = window.SvenssonDate.durationBetween(
                element.getAttribute("data-start"),
                element.getAttribute("data-end")
            );

            if (duration) {
                element.textContent = duration;
            }
        });
    }

    function setupCurrentYear() {
        var elements = document.querySelectorAll("[data-current-year]");
        var year = String(new Date().getFullYear());

        forEachNode(elements, function (element) {
            element.textContent = year;
        });
    }

    function setupContactForm() {
        var form = document.querySelector("[data-contact-form]");
        var button;
        var status;

        if (!form) {
            return;
        }

        button = form.querySelector("[data-submit-button]");
        status = form.querySelector("[data-form-status]");

        if (!button || !status || typeof XMLHttpRequest === "undefined") {
            return;
        }

        function setStatus(message, state) {
            status.textContent = message;
            status.setAttribute("data-state", state || "");
        }

        function finishSubmission() {
            button.disabled = false;
            button.textContent = "Skicka meddelande";
            form.removeAttribute("aria-busy");
        }

        form.addEventListener("submit", function (event) {
            var request = new XMLHttpRequest();
            var data;

            event.preventDefault();

            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            data = new FormData(form);
            button.disabled = true;
            button.textContent = "Skickar…";
            form.setAttribute("aria-busy", "true");
            setStatus("Skickar ditt meddelande…", "");

            request.open(form.method, form.action, true);
            request.setRequestHeader("Accept", "application/json");

            request.onreadystatechange = function () {
                if (request.readyState !== XMLHttpRequest.DONE) {
                    return;
                }

                finishSubmission();

                if (request.status >= 200 && request.status < 300) {
                    form.reset();
                    setStatus("Tack! Ditt meddelande är skickat.", "success");
                } else {
                    setStatus("Meddelandet kunde inte skickas. Mejla gärna direkt till alex@svensson.design.", "error");
                }
            };

            request.onerror = function () {
                finishSubmission();
                setStatus("Meddelandet kunde inte skickas. Mejla gärna direkt till alex@svensson.design.", "error");
            };

            request.send(data);
        });
    }

    function setupAnalyticsConsent() {
        var banner = document.querySelector("[data-consent-banner]");
        var acceptButton = document.querySelector("[data-consent-accept]");
        var rejectButton = document.querySelector("[data-consent-reject]");
        var settingsButton = document.querySelector("[data-consent-settings]");
        var storageKey = "svensson-analytics-consent";
        var measurementId = "G-HT5Y0FFG8L";

        if (!banner || !acceptButton || !rejectButton) {
            return;
        }

        function readConsent() {
            try {
                return window.localStorage.getItem(storageKey);
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

        function openBanner() {
            banner.hidden = false;
        }

        function closeBanner() {
            banner.hidden = true;
        }

        function loadAnalytics() {
            var script;

            if (window.__svenssonAnalyticsLoaded) {
                if (typeof window.gtag === "function") {
                    window.gtag("consent", "update", { analytics_storage: "granted" });
                }
                return;
            }

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
            window.gtag("config", measurementId, { anonymize_ip: true });

            script = document.createElement("script");
            script.async = true;
            script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(measurementId);
            document.head.appendChild(script);
        }

        function denyAnalytics() {
            if (typeof window.gtag === "function") {
                window.gtag("consent", "update", { analytics_storage: "denied" });
            }
        }

        acceptButton.addEventListener("click", function () {
            saveConsent("accepted");
            closeBanner();
            loadAnalytics();
        });

        rejectButton.addEventListener("click", function () {
            saveConsent("rejected");
            closeBanner();
            denyAnalytics();
        });

        if (settingsButton) {
            settingsButton.addEventListener("click", function () {
                openBanner();
                acceptButton.focus();
            });
        }

        if (readConsent() === "accepted") {
            loadAnalytics();
        } else if (readConsent() !== "rejected") {
            openBanner();
        }
    }

    function init() {
        setupNavigation();
        setupDurations();
        setupCurrentYear();
        setupContactForm();
        setupAnalyticsConsent();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
}());
