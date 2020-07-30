(function ($) {
    "use strict";

    $('a.js-scroll-trigger[href*="#"]:not([href="#"])').click(function () {
        if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
            var target = $(this.hash);
            target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
            if (target.length) {
                $('html, body').animate({
                    scrollTop: (target.offset().top)
                }, 1000, "easeInOutExpo");
                return false;
            }
        }
    });

    $('.js-scroll-trigger').click(function () {
        $('.navbar-collapse').collapse('hide');
    });

    $('body').scrollspy({
        target: '#sideNav'
    });

})(jQuery);
var element = document.querySelector('#months-between');
$("span#months-between").each(function(i){
    var startDate = new Date($(this).data('firstdate'));

    if ($(this).data('seconddate') == 'current') {
    var endDate = new Date();
    } else {
    var endDate = new Date($(this).data('seconddate'));
    }

    var endMoment   = moment(endDate);
    var startMoment = moment(startDate);

    if (endMoment.diff(startMoment, 'months') !== 1){
        var month = " månader";
    } else {
        var month = " månad";
    }

    console.log(endMoment.diff(startMoment, 'months'));
    $(this).prepend('(',endMoment.diff(startMoment, 'months'), month, ')');
});