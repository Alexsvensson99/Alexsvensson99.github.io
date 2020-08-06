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