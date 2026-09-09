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

    function init() {
        setupNavigation();
        setupDurations();
        setupCurrentYear();
        setupContactForm();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
}());
