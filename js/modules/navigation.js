/**
 * Navigation — мобильное меню + smooth scroll по якорям
 */
export function initNavigation() {
    const burger = document.getElementById('burger');
    const nav = document.getElementById('nav');
    const body = document.body;

    if (!burger || !nav) return;

    const closeMenu = () => {
        burger.classList.remove('is-active');
        nav.classList.remove('is-open');
        body.classList.remove('no-scroll');
    };

    const openMenu = () => {
        burger.classList.add('is-active');
        nav.classList.add('is-open');
        body.classList.add('no-scroll');
    };

    burger.addEventListener('click', () => {
        if (nav.classList.contains('is-open')) closeMenu();
        else openMenu();
    });

    // Dropdown на мобильных
    document.querySelectorAll('.nav__item--dropdown > .nav__link').forEach((link) => {
        link.addEventListener('click', (e) => {
            if (window.innerWidth <= 992) {
                e.preventDefault();
                link.parentElement.classList.toggle('is-active');
            }
        });
    });

    // Smooth scroll по ссылкам с #
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;

        const href = link.getAttribute('href');
        if (href === '#' || href.length < 2) return;

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();
        closeMenu();

        const headerH = document.getElementById('header').offsetHeight;
        const top = target.getBoundingClientRect().top + window.scrollY - headerH + 1;

        window.scrollTo({ top, behavior: 'smooth' });
    });

    // Закрытие меню при ресайзе
    window.addEventListener('resize', () => {
        if (window.innerWidth > 992) closeMenu();
    });
}
