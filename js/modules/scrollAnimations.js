/**
 * ScrollAnimations — появление элементов при скролле
 * Использует Intersection Observer API
 */
export function initScrollAnimations() {
    const items = document.querySelectorAll('[data-animate]');
    if (!items.length || !('IntersectionObserver' in window)) {
        // Fallback — показать сразу
        items.forEach((el) => el.classList.add('is-visible'));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const delay = entry.target.dataset.delay || 0;
                setTimeout(() => {
                    entry.target.classList.add('is-visible');
                }, delay);
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -60px 0px',
    });

    items.forEach((item) => observer.observe(item));
}
