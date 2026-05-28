/**
 * Counter — анимированный счётчик
 * Считает от 0 до целевого значения когда элемент попадает в viewport
 */
function animate(el, target, duration = 1800) {
    const start = performance.now();
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    const tick = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const value = Math.floor(easeOut(progress) * target);

        el.textContent = value.toLocaleString('ru-RU');

        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = target.toLocaleString('ru-RU');
    };

    requestAnimationFrame(tick);
}

export function initCounters() {
    const counters = document.querySelectorAll('[data-count]');
    if (!counters.length || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.dataset.count, 10);
                animate(entry.target, target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.4 });

    counters.forEach((el) => observer.observe(el));
}
