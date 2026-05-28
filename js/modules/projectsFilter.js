/**
 * ProjectsFilter — фильтрация карточек проектов
 * Использует data-status атрибуты + FLIP-подобную анимацию
 */
export function initProjectsFilter() {
    const filters = document.querySelectorAll('.filter');
    const projects = document.querySelectorAll('.project');
    if (!filters.length) return;

    filters.forEach((btn) => {
        btn.addEventListener('click', () => {
            const value = btn.dataset.filter;

            filters.forEach((f) => f.classList.remove('filter--active'));
            btn.classList.add('filter--active');

            projects.forEach((project) => {
                const status = project.dataset.status;
                const match = value === 'all' || status === value;

                if (match) {
                    project.style.display = '';
                    requestAnimationFrame(() => {
                        project.style.opacity = '1';
                        project.style.transform = 'scale(1)';
                    });
                } else {
                    project.style.opacity = '0';
                    project.style.transform = 'scale(0.94)';
                    setTimeout(() => {
                        project.style.display = 'none';
                    }, 350);
                }
            });
        });
    });
}
