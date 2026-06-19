#!/bin/bash
# ============================================================
#   BSK Capital Group — запуск проекта на macOS
#   Двойной клик по файлу запускает локальный сервер,
#   открывает сайт в браузере и сразу — админку.
# ============================================================

cd "$(dirname "$0")" || exit 1

PORT=8000
URL="http://localhost:${PORT}"
ADMIN_URL="${URL}/admin.html"

# ----- Цвета -----
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[1;34m'
NC='\033[0m'

clear
printf "\n"
printf "${BLUE} ============================================================${NC}\n"
printf "${BLUE}           BSK CAPITAL GROUP — Дипломный проект${NC}\n"
printf "${BLUE} ============================================================${NC}\n\n"

printf " ${YELLOW}Сайт:${NC}    ${URL}\n"
printf " ${YELLOW}Админка:${NC} ${ADMIN_URL}  (пароль по умолчанию: bsk2026)\n"
printf " Остановить: Ctrl+C или закройте окно\n\n"

# ----- Открыть браузер с задержкой -----
open_browser() {
    sleep 2
    open "${URL}" 2>/dev/null
    sleep 1
    open "${ADMIN_URL}" 2>/dev/null
}

# ===== 1) Python =====
if command -v python3 >/dev/null 2>&1; then
    printf "${GREEN} [OK]${NC} Найден python3 — запускаю встроенный сервер\n\n"
    open_browser &
    exec python3 -m http.server ${PORT}
fi

# ===== 2) Node.js =====
if command -v node >/dev/null 2>&1; then
    printf "${GREEN} [OK]${NC} Найден Node.js — запускаю через npx serve\n\n"
    open_browser &
    exec npx --yes serve . -l ${PORT}
fi

# ===== 3) Ни одного — ставим Node.js через Homebrew =====
printf "${YELLOW} [!] Ни python3, ни Node.js не найдены${NC}\n"
printf " Запускаю автоматическую установку Node.js\n\n"

# Homebrew
if ! command -v brew >/dev/null 2>&1; then
    printf " Устанавливаю Homebrew (потребуется пароль администратора)...\n\n"
    if ! /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"; then
        printf "\n${RED} [ОШИБКА]${NC} Не удалось установить Homebrew\n"
        printf " Установите Node.js вручную: https://nodejs.org/\n"
        read -p "Нажмите Enter для выхода..."
        exit 1
    fi

    # PATH для brew (Apple Silicon / Intel)
    if [ -x "/opt/homebrew/bin/brew" ]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
    elif [ -x "/usr/local/bin/brew" ]; then
        eval "$(/usr/local/bin/brew shellenv)"
    fi
fi

printf " Устанавливаю Node.js через Homebrew...\n\n"
if ! brew install node; then
    printf "\n${RED} [ОШИБКА]${NC} Не удалось установить Node.js через Homebrew\n"
    printf " Установите Node.js вручную: https://nodejs.org/\n"
    read -p "Нажмите Enter для выхода..."
    exit 1
fi

if command -v node >/dev/null 2>&1; then
    printf "\n${GREEN} [OK]${NC} Node.js установлен — запускаю сервер\n\n"
    open_browser &
    exec npx --yes serve . -l ${PORT}
else
    printf "\n${RED} [ОШИБКА]${NC} Node.js установлен, но недоступен в PATH\n"
    printf " Перезапустите Terminal и запустите файл ещё раз.\n"
    read -p "Нажмите Enter для выхода..."
    exit 1
fi
