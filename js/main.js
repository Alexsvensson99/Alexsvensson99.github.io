(function () {
    const scrollTriggers = document.querySelectorAll('a.js-scroll-trigger[href*="#"]:not([href="#"])');

    scrollTriggers.forEach(trigger => {
        trigger.addEventListener('click', function (event) {
            if (location.pathname.replace(/^\//, '') === this.pathname.replace(/^\//, '') && location.hostname === this.hostname) {
                let target = document.querySelector(this.hash);
                target = target ? target : document.querySelector('[name=' + this.hash.slice(1) + ']');
                if (target) {
                    event.preventDefault();
                    window.scrollTo({
                        top: target.offsetTop,
                        behavior: 'smooth'
                    });
                    return;
                }
            }
            document.querySelector('.navbar-collapse').classList.remove('show');
        });
    });

    document.body.setAttribute('data-bs-spy', 'scroll');
    document.body.setAttribute('data-bs-target', '#sideNav');

    const monthsBetweenElements = document.querySelectorAll("span#months-between");

    monthsBetweenElements.forEach(element => {
        let startDate = new Date(element.dataset.firstdate);
        let endDate = element.dataset.seconddate === 'current' ? new Date() : new Date(element.dataset.seconddate);

        let endMoment = moment(endDate);
        let startMoment = moment(startDate);

        let months = endMoment.diff(startMoment, 'months');
        let month = months !== 1 ? " månader" : " månad";

        element.textContent = `(${months}${month})`;
    });
})();

document.addEventListener('DOMContentLoaded', function () {
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Add animations on scroll
    const scrollElements = document.querySelectorAll('.js-scroll');
    const elementInView = (el, dividend = 1) => {
        const elementTop = el.getBoundingClientRect().top;
        return (
            elementTop <= (window.innerHeight || document.documentElement.clientHeight) / dividend
        );
    };

    const displayScrollElement = (element) => {
        element.classList.add('scrolled');
    };

    const handleScrollAnimation = () => {
        scrollElements.forEach((el) => {
            if (elementInView(el, 1.25)) {
                displayScrollElement(el);
            }
        });
    };

    window.addEventListener('scroll', () => {
        handleScrollAnimation();
    });
});
