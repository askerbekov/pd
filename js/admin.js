/**
 * admin.js — управление админкой:
 *   - простая клиентская защита паролем (sha-256 хеш в localStorage)
 *   - CRUD проектов через projectsStore
 *   - экспорт/импорт JSON
 *   - смена пароля
 *
 * ВАЖНО: это клиентская защита для статического сайта и она не заменяет
 * настоящую авторизацию. Если нужна реальная защита — выносите админку
 * за бекенд (Node/PHP/etc).
 */
import {
    getAllProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    resetToDefaults,
    exportJSON,
    importJSON,
    hasLocalChanges,
} from './modules/projectsStore.js';
import {
    getAllLeads,
    countLeadsByStatus,
    updateLead,
    deleteLead,
    clearAllLeads,
    exportLeadsCSV,
    LEAD_STATUSES,
} from './modules/leadsStore.js';

/* ============ Константы ============ */
const DEFAULT_PASSWORD = 'bsk2026';
const PASSWORD_KEY = 'bsk:admin:pwdHash:v1';
const SESSION_KEY = 'bsk:admin:session:v1';
const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 часов

/* ============ Утилиты ============ */
async function sha256(text) {
    const buf = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

async function getStoredHash() {
    let stored = localStorage.getItem(PASSWORD_KEY);
    if (!stored) {
        stored = await sha256(DEFAULT_PASSWORD);
        localStorage.setItem(PASSWORD_KEY, stored);
    }
    return stored;
}

function escapeHtml(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function toast(message, type = 'info', duration = 3500) {
    const el = document.getElementById('adminToast');
    if (!el) return;
    el.textContent = message;
    el.className = 'admin-toast is-visible admin-toast--' + type;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => {
        el.classList.remove('is-visible');
    }, duration);
}

function isSessionValid() {
    try {
        const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
        if (!raw) return false;
        const { until } = JSON.parse(raw);
        return typeof until === 'number' && until > Date.now();
    } catch {
        return false;
    }
}

function setSession() {
    const payload = JSON.stringify({ until: Date.now() + SESSION_TTL_MS });
    sessionStorage.setItem(SESSION_KEY, payload);
}

function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
}

/* ============ Экран входа ============ */
function initLogin() {
    const form = document.getElementById('loginForm');
    const error = document.getElementById('loginError');
    const input = document.getElementById('loginPassword');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        error.hidden = true;
        const value = input.value.trim();
        if (!value) {
            error.textContent = 'Введите пароль';
            error.hidden = false;
            return;
        }
        const expected = await getStoredHash();
        const actual = await sha256(value);
        if (actual !== expected) {
            error.textContent = 'Неверный пароль';
            error.hidden = false;
            input.select();
            return;
        }
        setSession();
        showShell();
    });
}

function showLogin() {
    document.getElementById('adminLogin').hidden = false;
    document.getElementById('adminShell').hidden = true;
    setTimeout(() => document.getElementById('loginPassword')?.focus(), 50);
}

async function showShell() {
    document.getElementById('adminLogin').hidden = true;
    document.getElementById('adminShell').hidden = false;
    await refreshList();
    refreshLeads();
    refreshDashboard();
    refreshBadge();
    setView('dashboard');
}

/* ============ Навигация по view ============ */
function setView(view) {
    document.querySelectorAll('.admin-nav__item').forEach((btn) => {
        btn.classList.toggle('is-active', btn.dataset.view === view);
    });
    document.querySelectorAll('.admin-view').forEach((sec) => {
        sec.hidden = sec.dataset.view !== view;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initNav() {
    document.querySelectorAll('.admin-nav__item').forEach((btn) => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            if (view === 'new') {
                openEditor(null);
            } else {
                setView(view);
                if (view === 'leads') refreshLeads();
                if (view === 'dashboard') refreshDashboard();
            }
        });
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        clearSession();
        showLogin();
    });

    document.addEventListener('click', (e) => {
        const back = e.target.closest('[data-action="back"]');
        if (back) {
            setView('list');
            refreshList();
            return;
        }
        const newBtn = e.target.closest('[data-action="new"]');
        if (newBtn) openEditor(null);
    });
}

/* ============ Список проектов ============ */
async function refreshList() {
    const table = document.getElementById('projectsTable');
    const projects = await getAllProjects({ force: true });
    document.getElementById('projectsCount').textContent = projects.length;

    if (!projects.length) {
        table.innerHTML = `
            <div class="admin-empty">
                Пока ни одного проекта. <button class="admin-link admin-link--accent" data-action="new">Создать первый</button>
            </div>`;
        return;
    }

    table.innerHTML = `
        <div class="admin-table__head">
            <div>Проект</div>
            <div>Класс</div>
            <div>Статус</div>
            <div>Сдача</div>
            <div></div>
        </div>
        ${projects
            .map(
                (p) => `
            <div class="admin-table__row" data-id="${escapeHtml(p.id)}">
                <div class="admin-table__name">
                    <div class="admin-table__thumb" style="background-image:url('${escapeHtml(p.image || '')}')"></div>
                    <div>
                        <strong>${escapeHtml(p.name)}</strong>
                        <small>${escapeHtml(p.location || '')}</small>
                    </div>
                </div>
                <div>${escapeHtml(p.class || '—')}</div>
                <div>
                    <span class="admin-pill admin-pill--${p.status === 'done' ? 'done' : 'building'}">
                        ${escapeHtml(p.statusLabel || (p.status === 'done' ? 'Сдан' : 'Строится'))}
                    </span>
                </div>
                <div>${escapeHtml(p.deadline || '—')}</div>
                <div class="admin-table__actions">
                    <a class="admin-btn admin-btn--ghost" href="project.html?id=${encodeURIComponent(p.id)}" target="_blank" rel="noopener" title="Посмотреть на сайте">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </a>
                    <button class="admin-btn admin-btn--ghost" data-edit="${escapeHtml(p.id)}" title="Редактировать">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="admin-btn admin-btn--ghost admin-btn--danger" data-delete="${escapeHtml(p.id)}" title="Удалить">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                    </button>
                </div>
            </div>`,
            )
            .join('')}
    `;

    table.querySelectorAll('[data-edit]').forEach((btn) => {
        btn.addEventListener('click', () => openEditor(btn.dataset.edit));
    });

    table.querySelectorAll('[data-delete]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.delete;
            if (!confirm('Удалить проект «' + (await getProjectById(id))?.name + '»? Действие нельзя отменить.')) return;
            await deleteProject(id);
            toast('Проект удалён', 'info');
            refreshList();
        });
    });
}

/* ============ Редактор проекта ============ */
function fillForm(form, project) {
    form.reset();
    form.elements.id.value = project?.id || '';
    form.elements.id_input.value = project?.id || '';
    form.elements.name.value = project?.name || '';
    form.elements.class.value = project?.class || '';
    form.elements.status.value = project?.status || 'building';
    form.elements.location.value = project?.location || '';
    form.elements.address.value = project?.address || '';
    form.elements.floors.value = project?.floors ?? '';
    form.elements.apartments.value = project?.apartments ?? '';
    form.elements.deadline.value = project?.deadline ?? '';
    form.elements.ceiling.value = project?.ceiling || '';
    form.elements.areaFrom.value = project?.areaFrom ?? '';
    form.elements.areaTo.value = project?.areaTo ?? '';
    form.elements.priceFrom.value = project?.priceFrom ?? '';
    form.elements.image.value = project?.image || '';
    form.elements.tagline.value = project?.tagline || '';
    form.elements.description.value = project?.description || '';
    form.elements.highlights.value = (project?.highlights || []).join('\n');
    form.elements.infrastructure.value = (project?.infrastructure || []).join('\n');
    form.elements.gallery.value = (project?.gallery || []).join('\n');
}

function readForm(form) {
    const fd = new FormData(form);
    const linesOf = (key) =>
        (fd.get(key) || '')
            .toString()
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean);

    const numberOr = (key) => {
        const v = fd.get(key);
        if (v === null || v === '') return undefined;
        const n = Number(v);
        return Number.isFinite(n) ? n : undefined;
    };

    const status = (fd.get('status') || 'building').toString();

    return {
        id: (fd.get('id_input') || '').toString().trim().toLowerCase(),
        slug: (fd.get('id_input') || '').toString().trim().toLowerCase(),
        name: (fd.get('name') || '').toString().trim(),
        class: (fd.get('class') || '').toString().trim(),
        status,
        statusLabel: status === 'done' ? 'Сдан' : 'Строится',
        location: (fd.get('location') || '').toString().trim(),
        address: (fd.get('address') || '').toString().trim(),
        floors: numberOr('floors'),
        apartments: numberOr('apartments'),
        deadline: (fd.get('deadline') || '').toString().trim(),
        deadlineLabel: status === 'done' ? 'Сдан' : 'Сдача',
        ceiling: (fd.get('ceiling') || '').toString().trim(),
        areaFrom: numberOr('areaFrom'),
        areaTo: numberOr('areaTo'),
        priceFrom: numberOr('priceFrom'),
        image: (fd.get('image') || '').toString().trim(),
        tagline: (fd.get('tagline') || '').toString().trim(),
        description: (fd.get('description') || '').toString().trim(),
        highlights: linesOf('highlights'),
        infrastructure: linesOf('infrastructure'),
        gallery: linesOf('gallery'),
    };
}

async function openEditor(id) {
    const form = document.getElementById('projectForm');
    const title = document.getElementById('editTitle');

    const project = id ? await getProjectById(id) : null;
    title.textContent = project ? `Редактирование: ${project.name}` : 'Новый проект';
    fillForm(form, project || {});

    setView('edit');
}

function initEditor() {
    const form = document.getElementById('projectForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = readForm(form);

        if (!data.name) {
            toast('Укажите название', 'error');
            return;
        }
        if (!data.id) {
            toast('Укажите ID проекта (slug)', 'error');
            return;
        }
        if (!/^[a-z0-9-]+$/.test(data.id)) {
            toast('ID может содержать только латиницу, цифры и дефис', 'error');
            return;
        }

        const originalId = form.elements.id.value;

        try {
            if (!originalId) {
                await createProject(data);
                toast('Проект создан', 'success');
            } else if (originalId === data.id) {
                await updateProject(originalId, data);
                toast('Проект обновлён', 'success');
            } else {
                // ID меняется — пересоздадим запись
                await deleteProject(originalId);
                await createProject(data);
                toast('Проект пересохранён с новым ID', 'success');
            }
            setView('list');
            refreshList();
        } catch (err) {
            console.error(err);
            toast('Ошибка сохранения: ' + err.message, 'error');
        }
    });
}

/* ============ Экспорт / Импорт ============ */
function download(filename, text, mime = 'application/json') {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function initData() {
    document.getElementById('downloadJson').addEventListener('click', async () => {
        const json = await exportJSON();
        download('projects.json', json);
        toast('Файл projects.json скачан', 'success');
    });

    document.getElementById('copyJson').addEventListener('click', async () => {
        const json = await exportJSON();
        try {
            await navigator.clipboard.writeText(json);
            toast('JSON скопирован в буфер', 'success');
        } catch {
            toast('Не удалось скопировать — браузер блокирует', 'error');
        }
    });

    const file = document.getElementById('importFile');
    document.getElementById('importBtn').addEventListener('click', () => file.click());
    file.addEventListener('change', async () => {
        const f = file.files?.[0];
        if (!f) return;
        try {
            const text = await f.text();
            importJSON(text);
            toast('Импортировано из файла', 'success');
            refreshList();
        } catch (err) {
            toast('Ошибка импорта: ' + err.message, 'error');
        } finally {
            file.value = '';
        }
    });

    document.getElementById('importTextBtn').addEventListener('click', () => {
        const text = document.getElementById('importText').value.trim();
        if (!text) {
            toast('Сначала вставьте JSON', 'error');
            return;
        }
        try {
            importJSON(text);
            toast('Импортировано из текста', 'success');
            refreshList();
        } catch (err) {
            toast('Ошибка импорта: ' + err.message, 'error');
        }
    });

    document.getElementById('resetBtn').addEventListener('click', async () => {
        if (!confirm('Сбросить локальные правки и вернуться к исходным проектам?')) return;
        await resetToDefaults();
        toast('Сброшено к исходным проектам', 'info');
        refreshList();
    });
}

/* ============ Смена пароля ============ */
function initPasswordForm() {
    document.getElementById('passwordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const current = form.current.value;
        const next = form.next.value;
        const confirm = form.confirm.value;

        if (next.length < 4) {
            toast('Новый пароль должен быть от 4 символов', 'error');
            return;
        }
        if (next !== confirm) {
            toast('Пароли не совпадают', 'error');
            return;
        }

        const expected = await getStoredHash();
        const currentHash = await sha256(current || '');
        if (current && currentHash !== expected) {
            toast('Неверный текущий пароль', 'error');
            return;
        }
        // Если current пустой — разрешаем только при дефолтном пароле
        if (!current) {
            const defHash = await sha256(DEFAULT_PASSWORD);
            if (expected !== defHash) {
                toast('Введите текущий пароль', 'error');
                return;
            }
        }

        const newHash = await sha256(next);
        localStorage.setItem(PASSWORD_KEY, newHash);
        form.reset();
        toast('Пароль обновлён', 'success');
    });
}

/* ============ Дашборд ============ */
async function refreshDashboard() {
    const stats = countLeadsByStatus();
    const projects = await getAllProjects();
    const building = projects.filter((p) => p.status === 'building').length;
    const done = projects.filter((p) => p.status === 'done').length;

    document.getElementById('dashboardStats').innerHTML = `
        <div class="admin-stat">
            <span class="admin-stat__label">Всего проектов</span>
            <strong class="admin-stat__value">${projects.length}</strong>
            <small>строится ${building} · сдано ${done}</small>
        </div>
        <div class="admin-stat admin-stat--accent">
            <span class="admin-stat__label">Новые заявки</span>
            <strong class="admin-stat__value">${stats.new}</strong>
            <small>требуют обработки</small>
        </div>
        <div class="admin-stat">
            <span class="admin-stat__label">В обработке</span>
            <strong class="admin-stat__value">${stats.inProgress}</strong>
            <small>взяты в работу</small>
        </div>
        <div class="admin-stat">
            <span class="admin-stat__label">Всего заявок</span>
            <strong class="admin-stat__value">${stats.total}</strong>
            <small>за всё время</small>
        </div>
    `;

    const recent = getAllLeads().slice(0, 5);
    document.getElementById('recentLeads').innerHTML = recent.length
        ? renderLeadsRows(recent)
        : `<div class="admin-empty">Пока ни одной заявки. Они появятся здесь после отправки форм с сайта.</div>`;
    bindLeadRowEvents(document.getElementById('recentLeads'));
}

/* ============ Заявки ============ */
function statusPill(status) {
    const s = LEAD_STATUSES.find((x) => x.value === status) || { label: status, value: status };
    return `<span class="admin-pill admin-pill--lead admin-pill--lead-${s.value}">${escapeHtml(s.label)}</span>`;
}

function statusSelect(lead) {
    return `<select class="admin-select admin-select--sm" data-status-for="${escapeHtml(lead.id)}">
        ${LEAD_STATUSES.map(
            (s) => `<option value="${s.value}" ${s.value === lead.status ? 'selected' : ''}>${escapeHtml(s.label)}</option>`,
        ).join('')}
    </select>`;
}

function renderLeadsRows(leads) {
    return `
        <div class="admin-table__head admin-table__head--leads">
            <div>Заявка</div>
            <div>Телефон</div>
            <div>Проект</div>
            <div>Статус</div>
            <div></div>
        </div>
        ${leads.map((l) => {
            const projectLabel = l.project || '—';
            const date = new Date(l.createdAt).toLocaleString('ru-RU');
            const cleanPhone = (l.phone || '').replace(/[^\d+]/g, '');
            return `
            <div class="admin-table__row admin-table__row--lead" data-id="${escapeHtml(l.id)}">
                <div class="admin-table__name">
                    <div class="admin-avatar">${escapeHtml((l.name || '?').trim().charAt(0).toUpperCase())}</div>
                    <div>
                        <strong>${escapeHtml(l.name || '(без имени)')}</strong>
                        <small>${escapeHtml(date)} · ${escapeHtml(l.source || 'site')}</small>
                        ${l.message ? `<p class="admin-table__msg">${escapeHtml(l.message)}</p>` : ''}
                    </div>
                </div>
                <div>
                    <a class="admin-link admin-link--accent" href="tel:${escapeHtml(cleanPhone)}">${escapeHtml(l.phone || '—')}</a>
                </div>
                <div>${escapeHtml(projectLabel)}</div>
                <div>
                    ${statusPill(l.status)}
                    ${statusSelect(l)}
                </div>
                <div class="admin-table__actions">
                    <a class="admin-btn admin-btn--ghost" href="tel:${escapeHtml(cleanPhone)}" title="Позвонить">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.12.84.31 1.66.57 2.45a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.79.26 1.61.45 2.45.57A2 2 0 0122 16.92z"/></svg>
                    </a>
                    <a class="admin-btn admin-btn--ghost" href="https://wa.me/${encodeURIComponent(cleanPhone.replace(/^\+/, ''))}" target="_blank" rel="noopener" title="WhatsApp">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8z"/></svg>
                    </a>
                    <button class="admin-btn admin-btn--ghost admin-btn--danger" data-delete-lead="${escapeHtml(l.id)}" title="Удалить">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                    </button>
                </div>
            </div>`;
        }).join('')}
    `;
}

function bindLeadRowEvents(root) {
    if (!root) return;
    root.querySelectorAll('[data-status-for]').forEach((sel) => {
        sel.addEventListener('change', () => {
            updateLead(sel.dataset.statusFor, { status: sel.value });
            refreshLeads();
            refreshDashboard();
            refreshBadge();
            toast('Статус обновлён', 'success', 1800);
        });
    });
    root.querySelectorAll('[data-delete-lead]').forEach((btn) => {
        btn.addEventListener('click', () => {
            if (!confirm('Удалить заявку?')) return;
            deleteLead(btn.dataset.deleteLead);
            refreshLeads();
            refreshDashboard();
            refreshBadge();
            toast('Заявка удалена', 'info', 1800);
        });
    });
}

function refreshLeads() {
    const table = document.getElementById('leadsTable');
    const filter = document.getElementById('leadsFilter')?.value || '';
    let leads = getAllLeads();
    if (filter) leads = leads.filter((l) => l.status === filter);

    document.getElementById('leadsCount').textContent = getAllLeads().length;

    if (!leads.length) {
        table.innerHTML = `<div class="admin-empty">${filter ? 'Нет заявок с таким статусом' : 'Пока ни одной заявки. Они появятся после отправки форм с сайта.'}</div>`;
        return;
    }
    table.innerHTML = renderLeadsRows(leads);
    bindLeadRowEvents(table);
}

function refreshBadge() {
    const badge = document.getElementById('leadsBadge');
    if (!badge) return;
    const { new: n } = countLeadsByStatus();
    if (n > 0) {
        badge.textContent = n;
        badge.hidden = false;
    } else {
        badge.hidden = true;
    }
}

function initLeads() {
    document.getElementById('leadsFilter')?.addEventListener('change', refreshLeads);
    document.getElementById('exportLeadsBtn')?.addEventListener('click', () => {
        const csv = exportLeadsCSV();
        download('leads.csv', '﻿' + csv, 'text/csv;charset=utf-8');
        toast('Файл leads.csv скачан', 'success');
    });
    document.getElementById('clearLeadsBtn')?.addEventListener('click', () => {
        if (!confirm('Удалить ВСЕ заявки? Действие нельзя отменить.')) return;
        clearAllLeads();
        refreshLeads();
        refreshDashboard();
        refreshBadge();
        toast('Все заявки удалены', 'info');
    });

    // Если форма на другой вкладке сохранила заявку — обновим
    window.addEventListener('bsk:leads:changed', () => {
        refreshLeads();
        refreshDashboard();
        refreshBadge();
    });
    window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith('bsk:leads')) {
            refreshLeads();
            refreshDashboard();
            refreshBadge();
        }
    });
}

/* ============ Bootstrap ============ */
async function bootstrap() {
    initLogin();
    initNav();
    initEditor();
    initData();
    initPasswordForm();
    initLeads();

    if (isSessionValid()) {
        await showShell();
    } else {
        showLogin();
    }

    // Подсказка про несохранённые локальные правки
    if (hasLocalChanges()) {
        // молча — это нормальное состояние
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
} else {
    bootstrap();
}
