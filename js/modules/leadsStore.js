/**
 * LeadsStore — хранилище заявок с форм сайта.
 *
 * Каждая заявка: { id, name, phone, project, message, source, status, createdAt, note }
 * Статусы: new | in-progress | called | closed
 *
 * Используется:
 *   - form.js (создание заявки при submit любой формы)
 *   - admin.js (просмотр/обработка/удаление в админке)
 *
 * Хранение — localStorage (`bsk:leads:v1`). Для деплоя с реальным
 * бекендом достаточно подменить этот модуль на API-клиент.
 */

const STORAGE_KEY = 'bsk:leads:v1';

export const LEAD_STATUSES = [
    { value: 'new',         label: 'Новая' },
    { value: 'in-progress', label: 'В обработке' },
    { value: 'called',      label: 'Перезвонили' },
    { value: 'closed',      label: 'Закрыта' },
];

function read() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function write(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('bsk:leads:changed'));
}

export function getAllLeads() {
    return read().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export function countLeadsByStatus() {
    const list = read();
    return {
        total: list.length,
        new: list.filter((l) => l.status === 'new').length,
        inProgress: list.filter((l) => l.status === 'in-progress').length,
        called: list.filter((l) => l.status === 'called').length,
        closed: list.filter((l) => l.status === 'closed').length,
    };
}

export function createLead(data) {
    const list = read();
    const lead = {
        id: 'lead-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
        name: (data.name || '').toString().trim(),
        phone: (data.phone || '').toString().trim(),
        project: (data.project || '').toString().trim(),
        message: (data.message || '').toString().trim(),
        source: (data.source || 'site').toString(),
        status: 'new',
        createdAt: Date.now(),
        note: '',
    };
    list.push(lead);
    write(list);
    return lead;
}

export function updateLead(id, patch) {
    const list = read().map((l) => (l.id === id ? { ...l, ...patch, id: l.id } : l));
    write(list);
    return list.find((l) => l.id === id);
}

export function deleteLead(id) {
    write(read().filter((l) => l.id !== id));
}

export function clearAllLeads() {
    write([]);
}

export function exportLeadsCSV() {
    const list = getAllLeads();
    const header = ['Дата', 'Имя', 'Телефон', 'Проект', 'Сообщение', 'Источник', 'Статус', 'Заметка'];
    const escape = (s) => {
        const str = (s ?? '').toString().replace(/"/g, '""');
        return /[",;\n]/.test(str) ? `"${str}"` : str;
    };
    const rows = list.map((l) => [
        new Date(l.createdAt).toLocaleString('ru-RU'),
        l.name,
        l.phone,
        l.project,
        l.message,
        l.source,
        LEAD_STATUSES.find((s) => s.value === l.status)?.label || l.status,
        l.note,
    ].map(escape).join(';'));
    return [header.join(';'), ...rows].join('\n');
}
