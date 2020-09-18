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
let element = document.querySelector('#months-between');
$("span#months-between").each(function(i){
    let startDate = new Date($(this).data('firstdate'));
    let endDate = '';
    if ($(this).data('seconddate') == 'current') {
    endDate = new Date();
    } else {
    endDate = new Date($(this).data('seconddate'));
    }

    let endMoment   = moment(endDate, "YYYY-MM");
    let startMoment = moment(startDate, "YYYY-MM");
    let month = '';
    if (endMoment.diff(startMoment, 'months') !== 1){
        month = " månader";
    } else {
        month = " månad";
    }

    console.log(endMoment.diff(startMoment, 'months'));
    $(this).prepend('(',endMoment.diff(startMoment, 'months'), month, ')');
});