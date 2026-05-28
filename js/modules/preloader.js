/**
 * Preloader — скрытие при полной загрузке страницы
 */
export function initPreloader() {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;

    const hide = () => {
        preloader.classList.add('is-hidden');
        setTimeout(() => preloader.remove(), 700);
    };

    if (document.readyState === 'complete') {
        setTimeout(hide, 800);
    } else {
        window.addEventListener('load', () => setTimeout(hide, 600));
    }
}
