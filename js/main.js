/**
 * BSK Capital Group — главный entry-point
 * Дипломная работа · Vanilla JavaScript ES6+ (модули)
 *
 * Архитектура:
 *  - main.js          — точка входа, инициализация
 *  - modules/         — изолированные модули
 *      preloader      — прелоадер
 *      header         — поведение шапки при скролле
 *      navigation     — мобильное меню + smooth-scroll
 *      heroSlider     — слайдер баннера
 *      projectsFilter — фильтр карточек проектов
 *      modal          — модальные окна
 *      form           — валидация и отправка форм
 *      scrollAnimations — анимация появления (IntersectionObserver)
 *      counter        — анимированный счётчик
 */

import { initPreloader }        from './modules/preloader.js';
import { initHeader }           from './modules/header.js';
import { initNavigation }       from './modules/navigation.js';
import { initHeroSlider }       from './modules/heroSlider.js';
import { initProjectsFilter }   from './modules/projectsFilter.js';
import { initModal }            from './modules/modal.js';
import { initForms }            from './modules/form.js';
import { initScrollAnimations } from './modules/scrollAnimations.js';
import { initCounters }         from './modules/counter.js';
import { renderProjects, initProjectsRender } from './modules/projectsRender.js';

/**
 * Запуск приложения после DOMContentLoaded
 */
async function bootstrap() {
    // Год в футере
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Сначала отрисовываем карточки проектов — фильтр и анимации
    // должны навешиваться уже на готовый DOM.
    await renderProjects();
    initProjectsRender();

    // Инициализация модулей
    initPreloader();
    initHeader();
    initNavigation();
    initHeroSlider({ interval: 6500 });
    initProjectsFilter();
    initModal();
    initForms();
    initScrollAnimations();
    initCounters();

    console.log('%cBSK Capital Group', 'color:#c0a060;font-family:serif;font-size:24px;font-weight:600;');
    console.log('%cДипломная работа · Vanilla JavaScript ES6+', 'color:#666;font-size:12px;');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
} else {
    bootstrap();
}
