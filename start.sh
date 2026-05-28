#!/bin/bash
# ============================================================
#   BSK Capital Group — запуск проекта на Linux
# ============================================================

set -e
cd "$(dirname "$0")"

echo ""
echo " ============================================================"
echo "           BSK CAPITAL GROUP — Дипломный проект"
echo " ============================================================"
echo ""

PORT=8000

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

xdg_open_safe() {
    if command -v xdg-open >/dev/null 2>&1; then
        (sleep 1 && xdg-open "http://localhost:${PORT}") &
    fi
}

# ===== Проверяем Python =====
if command -v python3 >/dev/null 2>&1; then
    printf "${GREEN} [OK]${NC} Python3 найден — запускаю сервер\n"
    printf " URL: ${YELLOW}http://localhost:${PORT}${NC}\n\n"
    xdg_open_safe
    exec python3 -m http.server ${PORT}
fi

# ===== Проверяем Node.js =====
if command -v node >/dev/null 2>&1; then
    printf "${GREEN} [OK]${NC} Node.js найден — запускаю сервер\n"
    printf " URL: ${YELLOW}http://localhost:${PORT}${NC}\n\n"
    xdg_open_safe
    exec npx --yes serve . -l ${PORT}
fi

# ===== Ничего нет — устанавливаем =====
printf "${YELLOW} [!] Не найдены Python и Node.js${NC}\n"
printf " Пытаюсь автоматически установить Node.js...\n\n"

if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update
    sudo apt-get install -y nodejs npm
elif command -v dnf >/dev/null 2>&1; then
    sudo dnf install -y nodejs npm
elif command -v pacman >/dev/null 2>&1; then
    sudo pacman -S --noconfirm nodejs npm
else
    printf "${RED} [ОШИБКА]${NC} Не могу определить пакетный менеджер\n"
    printf " Установите вручную: https://nodejs.org/\n"
    exit 1
fi

if command -v node >/dev/null 2>&1; then
    printf "\n${GREEN} [OK]${NC} Установлено! Запускаю сервер\n\n"
    xdg_open_safe
    exec npx --yes serve . -l ${PORT}
fi
