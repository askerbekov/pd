/**
 * HeroSlider — собственный слайдер для hero-секции
 * Без сторонних библиотек, autoplay + pager + клавиатура
 */
export function initHeroSlider({ interval = 6000 } = {}) {
    const slides = document.querySelectorAll('.hero__slide');
    const dots = document.querySelectorAll('.hero__dot');
    if (slides.length < 2) return;

    let current = 0;
    let timer = null;

    const show = (index) => {
        slides[current].classList.remove('hero__slide--active');
        dots[current]?.classList.remove('hero__dot--active');

        current = (index + slides.length) % slides.length;

        slides[current].classList.add('hero__slide--active');
        dots[current]?.classList.add('hero__dot--active');
    };

    const next = () => show(current + 1);
    const prev = () => show(current - 1);

    const start = () => {
        stop();
        timer = setInterval(next, interval);
    };

    const stop = () => {
        if (timer) clearInterval(timer);
        timer = null;
    };

    dots.forEach((dot) => {
        dot.addEventListener('click', () => {
            const idx = parseInt(dot.dataset.slide, 10);
            show(idx);
            start();
        });
    });

    // Pause on hover
    const hero = document.querySelector('.hero');
    hero?.addEventListener('mouseenter', stop);
    hero?.addEventListener('mouseleave', start);

    // Клавиатура
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { next(); start(); }
        if (e.key === 'ArrowLeft')  { prev(); start(); }
    });

    // Touch swipe
    let startX = 0;
    hero?.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
    }, { passive: true });
    hero?.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 50) {
            dx > 0 ? prev() : next();
            start();
        }
    }, { passive: true });

    start();
}
