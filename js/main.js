(function () {
    // Caching the scroll trigger element
    const $scrollTrigger = $('a.js-scroll-trigger[href*="#"]:not([href="#"])');

    // Attaching a click event handler to the scroll trigger element
    $scrollTrigger.on('click', function () {
        // Checking if the pathname and hostname of the current location match the target's pathname and hostname
        if (location.pathname.replace(/^\//, '') === this.pathname.replace(/^\//, '') && location.hostname === this.hostname) {
            // Caching the target element
            let target = $(this.hash);
            // If the target element does not exist, look for an element with a name attribute equal to the hash value
            target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
            // If the target element exists, animate the page to scroll to it
            if (target.length) {
                $('html, body').animate({
                    scrollTop: target.offset().top
                }, 1000, "easeInOutExpo");
                return false;
            }
        }
        // Hiding the navbar on click
        $('.navbar-collapse').collapse('hide');
    });

    // Initializing the scrollspy on the body element
    $('body').scrollspy({
        target: '#sideNav'
    });

    // Caching the months-between element
    const $monthsBetween = $("span#months-between");

    // Iterating over the months-between elements
    $monthsBetween.each(function () {
        // Getting the start date from the data-firstdate attribute
        let startDate = new Date($(this).data('firstdate'));
        // Getting the end date from the data-seconddate attribute
        let endDate = $(this).data('seconddate') === 'current' ? new Date() : new Date($(this).data('seconddate'));

        // Calculating the difference in months between the end date and start date using moment.js
        let endMoment = moment(endDate, "YYYY-MM").add(1, 'M');
        let startMoment = moment(startDate, "YYYY-MM");

        let months = endMoment.diff(startMoment, 'months');
        // Adding the appropriate text based on the number of months
        let month = months !== 1 ? " månader" : " månad";

        // Prepending the number of months to the element
        $(this).prepend(`(${months}${month})`);
    });
})();
