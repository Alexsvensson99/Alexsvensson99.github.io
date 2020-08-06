let element = document.querySelector('#months-between');
$("span#months-between").each(function(i){
    let startDate = new Date($(this).data('firstdate'));

    if ($(this).data('seconddate') == 'current') {
    let endDate = new Date();
    } else {
    let endDate = new Date($(this).data('seconddate'));
    }

    let endMoment   = moment(endDate);
    let startMoment = moment(startDate);

    if (endMoment.diff(startMoment, 'months') !== 1){
        let month = " månader";
    } else {
        let month = " månad";
    }

    console.log(endMoment.diff(startMoment, 'months'));
    $(this).prepend('(',endMoment.diff(startMoment, 'months'), month, ')');
});