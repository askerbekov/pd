/**
 * Header — фиксированная шапка
 * Меняет внешний вид при скролле
 */
export function initHeader() {
    const header = document.getElementById('header');
    if (!header) return;

    const update = () => {
        if (window.scrollY > 60) {
            header.classList.add('is-scrolled');
        } else {
            header.classList.remove('is-scrolled');
        }
    };

    update();

    // throttle через requestAnimationFrame
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                update();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}
