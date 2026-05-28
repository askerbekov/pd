# BSK Capital Group — клон сайта

Дипломный проект. Лендинг премиальной строительной компании на чистом JavaScript ES6+.

> Сайт-прототип: [capital-group.kg](https://capital-group.kg)

---

## Запуск одним кликом (для любого ПК)

В корне лежат **самозапускающиеся скрипты** — они сами проверят окружение,
при необходимости установят Node.js и запустят сервер с открытием браузера:

| ОС | Файл | Что делать |
|---|---|---|
| **Windows** | `start.bat` | Двойной клик. Если нет Node — поставит через `winget` или скачает MSI |
| **macOS** | `start.command` | Двойной клик. Если нет Python/Node — поставит через Homebrew |
| **Linux** | `start.sh` | `./start.sh` в терминале. Поставит Node через apt/dnf/pacman |

После запуска браузер откроется автоматически на `http://localhost:8000`.

## Запуск вручную

Поскольку используются ES-модули, нужен HTTP-сервер.

### Через Python (предустановлен на macOS/Linux)

```bash
python3 -m http.server 8000
```

### Через Node.js

```bash
npx serve .
# или
npm start
```

Откройте: **http://localhost:8000**

---

## Стек

- **HTML5** — семантическая разметка
- **CSS3** — Grid, Flexbox, custom properties, `clamp()`, `backdrop-filter`
- **JavaScript ES6+** — модули, async/await, IntersectionObserver
- **Google Fonts** — Cormorant Garamond + Manrope
- **OpenStreetMap** — встроенная карта офиса

Без фреймворков. Без бандлеров. Чистый Vanilla JS.

---

## Структура

```
js-project/
├── index.html             ← главная страница
├── css/
│   ├── reset.css
│   ├── style.css
│   └── responsive.css
├── js/
│   ├── main.js            ← точка входа
│   └── modules/           ← 9 изолированных модулей
├── img/
│   └── favicon.svg
└── docs/
    └── ДИПЛОМНАЯ_РАБОТА.md  ← полная документация
```

---

## Что реализовано

- ✅ 8 секций (Hero, About, Projects, Advantages, Partners, FAQ, CTA, Contacts)
- ✅ Слайдер баннера с autoplay, клавиатурой и touch-swipe
- ✅ Фильтр проектов по статусу
- ✅ Модальное окно «Заказать звонок»
- ✅ Аккордеон FAQ (`<details>`)
- ✅ Валидация форм + маска телефона
- ✅ Анимированные счётчики статистики
- ✅ Появление блоков при скролле
- ✅ Toast-уведомления
- ✅ Адаптив под 4 breakpoint'a
- ✅ Кастомный прелоадер

---

## Документация для дипломной

Полное описание архитектуры, технологий и принятых решений — в файле
[`docs/ДИПЛОМНАЯ_РАБОТА.md`](docs/ДИПЛОМНАЯ_РАБОТА.md)

---

© 2026 · Дипломная работа · BSK Capital Group clone
