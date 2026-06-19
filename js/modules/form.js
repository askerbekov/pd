/**
 * Form — валидация и обработка отправки форм
 * Маска для телефона, кастомные сообщения, toast-уведомления
 * Каждый submit создаёт заявку в leadsStore (видна в админке).
 */
import { createLead } from './leadsStore.js';

const PHONE_REGEX = /^\+?[\d\s()-]{10,}$/;

const validators = {
    name: (value) => {
        if (!value.trim()) return 'Введите имя';
        if (value.trim().length < 2) return 'Имя слишком короткое';
        return '';
    },
    phone: (value) => {
        if (!value.trim()) return 'Введите телефон';
        if (!PHONE_REGEX.test(value)) return 'Некорректный номер телефона';
        return '';
    },
};

/**
 * Маска для телефона +996 (XXX) XXX-XXX
 */
function applyPhoneMask(input) {
    input.addEventListener('input', (e) => {
        let digits = e.target.value.replace(/\D/g, '');

        if (digits.startsWith('996')) digits = digits.slice(3);
        digits = digits.slice(0, 9);

        let formatted = '+996 ';
        if (digits.length > 0) formatted += '(' + digits.slice(0, 3);
        if (digits.length >= 3) formatted += ') ';
        if (digits.length > 3) formatted += digits.slice(3, 6);
        if (digits.length > 6) formatted += '-' + digits.slice(6, 9);

        e.target.value = formatted;
    });

    input.addEventListener('focus', (e) => {
        if (!e.target.value) e.target.value = '+996 ';
    });
}

/**
 * Показ ошибки рядом с полем
 */
function showError(field, message) {
    const errorEl = field.parentElement.querySelector('.form__error');
    if (errorEl) errorEl.textContent = message;
    field.parentElement.classList.toggle('has-error', !!message);
}

/**
 * Валидация одного поля
 */
function validateField(field) {
    const name = field.name;
    const validator = validators[name];
    if (!validator) return true;

    const error = validator(field.value);
    showError(field, error);
    return !error;
}

/**
 * Toast-уведомление
 */
function showToast(message, duration = 4000) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('is-visible');

    setTimeout(() => toast.classList.remove('is-visible'), duration);
}

/**
 * Инициализация одной формы
 */
function initForm(form) {
    // Маска для телефона
    const phoneInput = form.querySelector('input[type="tel"]');
    if (phoneInput) applyPhoneMask(phoneInput);

    // Live-валидация при потере фокуса
    form.querySelectorAll('input[required]').forEach((input) => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => {
            if (input.parentElement.classList.contains('has-error')) {
                validateField(input);
            }
        });
    });

    // Отправка формы
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Валидируем все поля
        const fields = form.querySelectorAll('input[required]');
        let isValid = true;
        fields.forEach((field) => {
            if (!validateField(field)) isValid = false;
        });

        if (!isValid) {
            showToast('Пожалуйста, заполните корректно все поля');
            return;
        }

        // Собираем данные
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Имитируем отправку (в реальности — fetch на сервер)
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Отправляем...';
        submitBtn.disabled = true;

        try {
            await new Promise((resolve) => setTimeout(resolve, 600));

            // Сохраняем заявку, чтобы оператор увидел её в админке
            const source = form.dataset.source || form.id || 'site';
            createLead({ ...data, source });

            console.log('Отправлено:', data);
            showToast('Спасибо! Мы свяжемся с вами в течение 15 минут');
            form.reset();

            // Закрываем модалку если форма внутри
            const modal = form.closest('.modal');
            if (modal) {
                setTimeout(() => {
                    document.querySelector('[data-modal-close]')?.click();
                }, 1000);
            }
        } catch (err) {
            showToast('Ошибка отправки. Попробуйте позже');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

export function initForms() {
    document.querySelectorAll('form').forEach(initForm);
}

export { showToast };
