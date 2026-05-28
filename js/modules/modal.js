/**
 * Modal — управление модальными окнами
 * Открытие через data-modal-open, закрытие через data-modal-close
 * + блокировка скролла + focus trap + Escape
 */
export function initModal() {
    let activeModal = null;
    let lastFocused = null;

    const open = (id) => {
        const modal = document.getElementById(`modal-${id}`);
        if (!modal) return;

        activeModal = modal;
        lastFocused = document.activeElement;

        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('no-scroll');

        // Фокус на первый input
        setTimeout(() => {
            const firstInput = modal.querySelector('input, button');
            firstInput?.focus();
        }, 100);
    };

    const close = () => {
        if (!activeModal) return;

        activeModal.classList.remove('is-open');
        activeModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('no-scroll');

        // Возвращаем фокус
        lastFocused?.focus();
        activeModal = null;
    };

    // Открытие
    document.querySelectorAll('[data-modal-open]').forEach((trigger) => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            open(trigger.dataset.modalOpen);
        });
    });

    // Закрытие
    document.addEventListener('click', (e) => {
        if (e.target.closest('[data-modal-close]')) close();
    });

    // Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && activeModal) close();
    });

    return { open, close };
}
