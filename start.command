#!/bin/bash
# ============================================================
#   BSK Capital Group — запуск проекта на macOS
#   Двойной клик по файлу запускает сервер и открывает браузер
# ============================================================

set -e
cd "$(dirname "$0")"

echo ""
echo " ============================================================"
echo "           BSK CAPITAL GROUP — Дипломный проект"
echo " ============================================================"
echo ""

PORT=8000

# Цвета
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# ===== Проверяем Python =====
if command -v python3 >/dev/null 2>&1; then
    printf "${GREEN} [OK]${NC} Python3 найден — запускаю сервер\n"
    printf " URL: ${YELLOW}http://localhost:${PORT}${NC}\n"
    printf " Чтобы остановить — закройте окно или Ctrl+C\n\n"
    (sleep 1 && open "http://localhost:${PORT}") &
    exec python3 -m http.server ${PORT}
fi

# ===== Проверяем Node.js =====
if command -v node >/dev/null 2>&1; then
    printf "${GREEN} [OK]${NC} Node.js найден — запускаю сервер через npx\n"
    printf " URL: ${YELLOW}http://localhost:${PORT}${NC}\n\n"
    (sleep 2 && open "http://localhost:${PORT}") &
    exec npx --yes serve . -l ${PORT}
fi

# ===== Ни того, ни другого нет — устанавливаем Node.js =====
printf "${YELLOW} [!] Не найдены Python и Node.js${NC}\n"
printf " Запускаю автоматическую установку Node.js\n\n"

# Проверяем Homebrew
if ! command -v brew >/dev/null 2>&1; then
    printf " Устанавливаю Homebrew (потребуется пароль)...\n"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # Добавляем brew в PATH
    if [ -d "/opt/homebrew/bin" ]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
    elif [ -d "/usr/local/Homebrew" ]; then
        eval "$(/usr/local/bin/brew shellenv)"
    fi
fi

printf " Устанавливаю Node.js через Homebrew...\n"
brew install node

if command -v node >/dev/null 2>&1; then
    printf "${GREEN} [OK]${NC} Node.js установлен — запускаю сервер\n\n"
    (sleep 2 && open "http://localhost:${PORT}") &
    exec npx --yes serve . -l ${PORT}
else
    printf "${RED} [ОШИБКА]${NC} Не удалось установить Node.js\n"
    printf " Установите вручную: https://nodejs.org/\n"
    read -p "Нажмите Enter для выхода..."
    exit 1
fi
