(function (root, factory) {
    var api = factory();

    if (typeof module === "object" && module.exports) {
        module.exports = api;
    } else {
        root.SvenssonDate = api;
    }
}(typeof window !== "undefined" ? window : this, function () {
    "use strict";

    function parseYearMonth(value, now) {
        var current = now instanceof Date ? now : new Date();
        var match;
        var year;
        var month;

        if (value === "current") {
            return {
                year: current.getFullYear(),
                month: current.getMonth() + 1
            };
        }

        if (typeof value !== "string") {
            return null;
        }

        match = /^(\d{4})-(\d{2})$/.exec(value);
        if (!match) {
            return null;
        }

        year = Number(match[1]);
        month = Number(match[2]);

        if (year < 1900 || month < 1 || month > 12) {
            return null;
        }

        return { year: year, month: month };
    }

    function monthsBetween(startValue, endValue, now) {
        var start = parseYearMonth(startValue, now);
        var end = parseYearMonth(endValue, now);
        var months;

        if (!start || !end) {
            return null;
        }

        months = ((end.year - start.year) * 12) + (end.month - start.month);
        return months >= 0 ? months : null;
    }

    function formatDuration(totalMonths) {
        var years;
        var months;
        var parts = [];

        if (typeof totalMonths !== "number" || !isFinite(totalMonths) || totalMonths < 0) {
            return "";
        }

        years = Math.floor(totalMonths / 12);
        months = totalMonths % 12;

        if (years > 0) {
            parts.push(years + " år");
        }

        if (months > 0 || years === 0) {
            parts.push(months + (months === 1 ? " månad" : " månader"));
        }

        return parts.join(" ");
    }

    function durationBetween(startValue, endValue, now) {
        var months = monthsBetween(startValue, endValue, now);
        return months === null ? "" : formatDuration(months);
    }

    return {
        parseYearMonth: parseYearMonth,
        monthsBetween: monthsBetween,
        formatDuration: formatDuration,
        durationBetween: durationBetween
    };
}));
