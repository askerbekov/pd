/**
 * ProjectsRender — рендер карточек проектов на главной.
 * Берёт данные из projectsStore и подставляет в #projectsGrid.
 * Также обновляет подменю и select в форме контактов.
 */
import { getAllProjects } from './projectsStore.js';

const ICON_PIN = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
const ICON_ARROW = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;

function escapeHtml(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function cardHtml(p) {
    const detailUrl = `project.html?id=${encodeURIComponent(p.id)}`;
    const statusMod = p.status === 'done' ? 'done' : 'building';
    const statusLabel = p.statusLabel || (p.status === 'done' ? 'Сдан' : 'Строится');
    const deadlineLabel = p.deadlineLabel || (p.status === 'done' ? 'Сдан' : 'Сдача');

    return `
        <article class="project" id="project-${escapeHtml(p.id)}" data-status="${escapeHtml(p.status)}">
            <a class="project__image" href="${detailUrl}" aria-label="Подробнее о ${escapeHtml(p.name)}">
                <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy" />
                <span class="project__status project__status--${statusMod}">${escapeHtml(statusLabel)}</span>
            </a>
            <div class="project__body">
                <span class="project__class">${escapeHtml(p.class || '')}</span>
                <h3 class="project__name">
                    <a href="${detailUrl}">${escapeHtml(p.name)}</a>
                </h3>
                <p class="project__location">
                    ${ICON_PIN}
                    ${escapeHtml(p.location || '')}
                </p>
                <div class="project__info">
                    <div><span>Этажность</span><strong>${escapeHtml(p.floors ?? '—')}</strong></div>
                    <div><span>Квартир</span><strong>${escapeHtml(p.apartments ?? '—')}</strong></div>
                    <div><span>${escapeHtml(deadlineLabel)}</span><strong>${escapeHtml(p.deadline ?? '—')}</strong></div>
                </div>
                <a href="${detailUrl}" class="project__link">Подробнее ${ICON_ARROW}</a>
            </div>
        </article>
    `;
}

function renderGrid(projects) {
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;
    grid.innerHTML = projects.map(cardHtml).join('');
}

function renderSubmenu(projects) {
    const submenu = document.querySelector('.nav__submenu');
    if (!submenu) return;
    submenu.innerHTML = projects
        .map(
            (p) =>
                `<li><a href="project.html?id=${encodeURIComponent(p.id)}" class="nav__sublink">${escapeHtml(p.name)}</a></li>`,
        )
        .join('');
}

function renderFooterList(projects) {
    const footerCols = document.querySelectorAll('.footer__col');
    footerCols.forEach((col) => {
        const heading = col.querySelector('h4');
        if (!heading) return;
        if (heading.textContent.trim().toLowerCase() === 'проекты') {
            const ul = col.querySelector('ul');
            if (ul) {
                ul.innerHTML = projects
                    .map(
                        (p) =>
                            `<li><a href="project.html?id=${encodeURIComponent(p.id)}">${escapeHtml(p.name)}</a></li>`,
                    )
                    .join('');
            }
        }
    });
}

function renderContactSelect(projects) {
    const select = document.querySelector('select[name="project"]');
    if (!select) return;
    select.innerHTML =
        '<option value="">Любой проект</option>' +
        projects.map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join('');
}

export async function renderProjects() {
    try {
        const projects = await getAllProjects({ force: true });
        renderGrid(projects);
        renderSubmenu(projects);
        renderFooterList(projects);
        renderContactSelect(projects);
    } catch (err) {
        console.warn('[projectsRender] Не удалось загрузить проекты:', err);
    }
}

export function initProjectsRender() {
    renderProjects();
    // Если админка в другой вкладке поменяла проекты — перерисуем
    window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith('bsk:projects')) renderProjects();
    });
    window.addEventListener('bsk:projects:changed', renderProjects);
}
