/**
 * ProjectsStore — единый слой данных для проектов.
 *
 * Источники данных (по приоритету):
 *  1) localStorage (правки из админки) — если есть, используются полностью
 *  2) data/projects.json — дефолтный набор, который шиппится с сайтом
 *
 * Используется на главной (рендер карточек), на project.html (детальная страница)
 * и в админке (CRUD + экспорт/импорт).
 */

const STORAGE_KEY = 'bsk:projects:v1';
const JSON_URL = new URL('../../data/projects.json', import.meta.url).href;

let _cache = null;

/* ============ Внутренние помощники ============ */

function readLocal() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

function writeLocal(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    _cache = list;
    // Уведомляем другие вкладки/страницы
    window.dispatchEvent(new CustomEvent('bsk:projects:changed'));
}

async function fetchDefault() {
    const res = await fetch(JSON_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('Не удалось загрузить data/projects.json');
    return res.json();
}

function ensureId(p) {
    if (p.id) return p;
    const base = (p.slug || p.name || 'project')
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9а-я]+/gi, '-')
        .replace(/^-+|-+$/g, '');
    return { ...p, id: base || 'project-' + Date.now() };
}

/* ============ Публичный API ============ */

/**
 * Загрузить весь список проектов.
 * Возвращает массив объектов.
 */
export async function getAllProjects({ force = false } = {}) {
    if (_cache && !force) return _cache;

    const local = readLocal();
    if (local) {
        _cache = local;
        return _cache;
    }

    const def = await fetchDefault();
    _cache = def;
    return _cache;
}

/**
 * Найти проект по id (или slug).
 */
export async function getProjectById(id) {
    const all = await getAllProjects();
    return all.find((p) => p.id === id || p.slug === id) || null;
}

/**
 * Сохранить весь список (используется админкой и импортом).
 */
export function saveAllProjects(list) {
    const normalized = list.map(ensureId);
    writeLocal(normalized);
    return normalized;
}

/**
 * Создать новый проект.
 */
export async function createProject(data) {
    const all = await getAllProjects();
    const next = ensureId({ ...data });
    if (all.some((p) => p.id === next.id)) {
        next.id = next.id + '-' + Date.now().toString(36);
    }
    const updated = [...all, next];
    saveAllProjects(updated);
    return next;
}

/**
 * Обновить существующий проект (по id).
 */
export async function updateProject(id, patch) {
    const all = await getAllProjects();
    const updated = all.map((p) => (p.id === id ? { ...p, ...patch, id: p.id } : p));
    saveAllProjects(updated);
    return updated.find((p) => p.id === id);
}

/**
 * Удалить проект.
 */
export async function deleteProject(id) {
    const all = await getAllProjects();
    const updated = all.filter((p) => p.id !== id);
    saveAllProjects(updated);
}

/**
 * Сбросить локальные правки и вернуться к data/projects.json.
 */
export async function resetToDefaults() {
    localStorage.removeItem(STORAGE_KEY);
    _cache = null;
    return getAllProjects({ force: true });
}

/**
 * Экспорт JSON-строки текущего состояния (для скачивания).
 */
export async function exportJSON() {
    const all = await getAllProjects();
    return JSON.stringify(all, null, 2);
}

/**
 * Импорт из JSON-строки (заменяет всё содержимое).
 */
export function importJSON(jsonString) {
    const data = JSON.parse(jsonString);
    if (!Array.isArray(data)) throw new Error('Ожидался массив проектов');
    return saveAllProjects(data);
}

/**
 * Есть ли локальные правки (для подсказок в админке).
 */
export function hasLocalChanges() {
    return readLocal() !== null;
}
