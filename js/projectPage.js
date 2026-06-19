/**
 * project.html — entry-point детальной страницы проекта.
 * Достаёт ?id= из URL, загружает проект из стора и рендерит шаблон.
 */
import { getAllProjects, getProjectById } from './modules/projectsStore.js';
import { initHeader }     from './modules/header.js';
import { initNavigation } from './modules/navigation.js';
import { initModal }      from './modules/modal.js';
import { initForms }      from './modules/form.js';

function escapeHtml(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function getProjectIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || params.get('project') || null;
}

function renderNotFound() {
    const hero = document.getElementById('projectHero');
    if (hero) {
        hero.innerHTML = `
            <div class="container project-hero__container" style="max-width:760px;">
                <nav class="breadcrumbs">
                    <a href="index.html">Главная</a>
                    <span>/</span>
                    <a href="index.html#projects">Проекты</a>
                </nav>
                <h1 class="project-hero__title">Проект не найден</h1>
                <p class="project-hero__tagline">Возможно, ссылка устарела или проект был удалён.</p>
                <div class="project-hero__actions">
                    <a href="index.html#projects" class="btn btn--primary btn--lg">Все проекты</a>
                </div>
            </div>
        `;
        hero.querySelector('.project-hero__bg')?.remove?.();
    }
    document.querySelectorAll('section.project-info, section.project-gallery, section.cta').forEach((el) => el.remove());
}

function renderProject(p) {
    document.getElementById('pageTitle').textContent = `${p.name} — BSK Capital Group`;
    document.getElementById('crumbName').textContent = p.name;

    const bg = document.getElementById('projectHeroBg');
    if (bg && p.image) bg.style.backgroundImage = `url('${p.image}')`;

    const statusEl = document.getElementById('projectStatus');
    statusEl.textContent = p.statusLabel || (p.status === 'done' ? 'Сдан' : 'Строится');
    statusEl.dataset.status = p.status || 'building';

    document.getElementById('projectName').textContent = p.name;
    document.getElementById('projectTagline').textContent = p.tagline || p.class || '';

    const deadlineLabel = p.deadlineLabel || (p.status === 'done' ? 'Сдан' : 'Сдача');
    const metaItems = [
        { label: 'Класс', value: p.class },
        { label: 'Локация', value: p.location },
        { label: 'Этажность', value: p.floors },
        { label: 'Квартир', value: p.apartments },
        { label: deadlineLabel, value: p.deadline },
    ].filter((m) => m.value !== undefined && m.value !== null && m.value !== '');

    document.getElementById('projectMeta').innerHTML = metaItems
        .map((m) => `<div><span>${escapeHtml(m.label)}</span><strong>${escapeHtml(m.value)}</strong></div>`)
        .join('');

    document.getElementById('aboutTitle').innerHTML = `Жилой комплекс<br /><span class="text-accent">${escapeHtml(p.name)}</span>`;
    document.getElementById('projectDescription').textContent = p.description || '';

    const highlights = Array.isArray(p.highlights) ? p.highlights : [];
    document.getElementById('projectHighlights').innerHTML = highlights
        .map((h) => `<li>${escapeHtml(h)}</li>`)
        .join('') || '<li>Информация скоро появится</li>';

    const infra = Array.isArray(p.infrastructure) ? p.infrastructure : [];
    document.getElementById('projectInfrastructure').innerHTML = infra
        .map((h) => `<li>${escapeHtml(h)}</li>`)
        .join('') || '<li>Информация скоро появится</li>';

    const specs = [
        ['Класс жилья', p.class],
        ['Статус', p.statusLabel || (p.status === 'done' ? 'Сдан' : 'Строится')],
        ['Этажность', p.floors],
        ['Всего квартир', p.apartments],
        ['Высота потолков', p.ceiling],
        ['Площадь, м²', p.areaFrom && p.areaTo ? `${p.areaFrom} – ${p.areaTo}` : null],
        ['Цена от, $/м²', p.priceFrom],
        ['Адрес', p.address || p.location],
        [deadlineLabel, p.deadline],
    ].filter(([, v]) => v !== undefined && v !== null && v !== '');

    document.getElementById('projectSpecs').innerHTML = specs
        .map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd>`)
        .join('');

    const gallery = Array.isArray(p.gallery) && p.gallery.length ? p.gallery : [p.image].filter(Boolean);
    document.getElementById('projectGallery').innerHTML = gallery
        .map(
            (src, i) =>
                `<figure data-lightbox="${i}"><img src="${escapeHtml(src)}" alt="${escapeHtml(p.name)}" loading="lazy" /></figure>`,
        )
        .join('');

    // Inline-форма «Записаться на показ» — подставим имя проекта
    const leadName = document.getElementById('leadProjectName');
    if (leadName) leadName.textContent = p.name;
    const leadInput = document.getElementById('leadProjectInput');
    if (leadInput) leadInput.value = p.id;

    initLightbox(gallery, p.name);
}

/* ============ Lightbox ============ */
function initLightbox(images, alt) {
    const lightbox = document.getElementById('lightbox');
    const imgEl = document.getElementById('lightboxImg');
    const counter = document.getElementById('lightboxCounter');
    if (!lightbox || !images?.length) return;

    let index = 0;

    const show = (i) => {
        index = (i + images.length) % images.length;
        imgEl.src = images[index];
        imgEl.alt = alt || '';
        counter.textContent = `${index + 1} / ${images.length}`;
    };

    const open = (i) => {
        show(i);
        lightbox.classList.add('is-open');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.classList.add('no-scroll');
    };

    const close = () => {
        lightbox.classList.remove('is-open');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('no-scroll');
    };

    document.querySelectorAll('[data-lightbox]').forEach((fig) => {
        fig.addEventListener('click', () => open(Number(fig.dataset.lightbox)));
    });

    lightbox.querySelector('[data-lightbox-close]')?.addEventListener('click', close);
    lightbox.querySelector('[data-lightbox-prev]')?.addEventListener('click', () => show(index - 1));
    lightbox.querySelector('[data-lightbox-next]')?.addEventListener('click', () => show(index + 1));

    // Клик по фону закрывает
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) close();
    });

    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('is-open')) return;
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowLeft') show(index - 1);
        if (e.key === 'ArrowRight') show(index + 1);
    });
}

async function renderSubmenuAndFooter(currentId) {
    const all = await getAllProjects();

    const submenu = document.getElementById('navProjects');
    if (submenu) {
        submenu.innerHTML = all
            .map(
                (p) =>
                    `<li><a href="project.html?id=${encodeURIComponent(p.id)}" class="nav__sublink${
                        p.id === currentId ? ' is-current' : ''
                    }">${escapeHtml(p.name)}</a></li>`,
            )
            .join('');
    }

    const footer = document.getElementById('footerProjects');
    if (footer) {
        footer.innerHTML = all
            .map(
                (p) =>
                    `<li><a href="project.html?id=${encodeURIComponent(p.id)}">${escapeHtml(p.name)}</a></li>`,
            )
            .join('');
    }
}

async function bootstrap() {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const id = getProjectIdFromUrl();
    const project = id ? await getProjectById(id) : null;

    await renderSubmenuAndFooter(id);

    if (!project) {
        renderNotFound();
    } else {
        renderProject(project);
    }

    initHeader();
    initNavigation();
    initModal();
    initForms();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
} else {
    bootstrap();
}
