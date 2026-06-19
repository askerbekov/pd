@echo off
chcp 65001 >nul
title BSK Capital Group - Запуск проекта
color 0E

echo.
echo  ============================================================
echo            BSK CAPITAL GROUP - Дипломный проект
echo  ============================================================
echo.
echo  Проверяю окружение...
echo.

cd /d "%~dp0"

REM ========== Проверка Python ==========
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo  [OK] Python найден - запускаю сервер на Python
    goto :run_python
)

py --version >nul 2>&1
if %errorlevel% equ 0 (
    echo  [OK] Python ^(py^) найден - запускаю сервер на Python
    goto :run_python_alt
)

REM ========== Проверка Node.js ==========
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo  [OK] Node.js найден - запускаю сервер через npx
    goto :run_node
)

REM ========== Ничего нет - устанавливаем Node.js ==========
echo.
echo  [!] Не найдены Python и Node.js
echo  [!] Запускаю автоматическую установку Node.js
echo.
echo  Это займёт 2-3 минуты. Согласитесь на UAC при запросе.
echo.
pause

REM Пытаемся установить через winget (Windows 10/11)
where winget >nul 2>&1
if %errorlevel% equ 0 (
    echo  Устанавливаю Node.js через winget...
    winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements --silent
    if %errorlevel% equ 0 goto :after_install
)

REM Запасной вариант - скачиваем MSI напрямую
echo  Скачиваю установщик Node.js LTS...
powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi' -OutFile '%TEMP%\nodejs.msi'"
if not exist "%TEMP%\nodejs.msi" (
    echo  [ОШИБКА] Не удалось скачать Node.js
    echo  Скачайте вручную: https://nodejs.org/
    pause
    exit /b 1
)
echo  Устанавливаю Node.js...
msiexec /i "%TEMP%\nodejs.msi" /quiet /norestart
del "%TEMP%\nodejs.msi"

:after_install
echo  Обновляю переменную PATH...
for /f "tokens=2*" %%a in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v PATH') do set "PATH=%%b;%PATH%"
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  [!] Установка завершена, но требуется перезапуск
    echo  [!] Закройте этот файл и запустите снова
    echo.
    pause
    exit /b 0
)

REM ========== Запуск через Node.js ==========
:run_node
echo.
echo  ============================================================
echo   Сервер запускается на http://localhost:8000
echo   Чтобы остановить - закройте это окно
echo  ============================================================
echo.
start "" "http://localhost:8000"
start "" "http://localhost:8000/admin.html"
call npx --yes serve . -l 8000
goto :end

REM ========== Запуск через Python ==========
:run_python
echo.
echo  ============================================================
echo   Сервер запускается на http://localhost:8000
echo   Чтобы остановить - закройте это окно
echo  ============================================================
echo.
start "" "http://localhost:8000"
start "" "http://localhost:8000/admin.html"
python -m http.server 8000
goto :end

:run_python_alt
echo.
echo  ============================================================
echo   Сервер запускается на http://localhost:8000
echo   Чтобы остановить - закройте это окно
echo  ============================================================
echo.
start "" "http://localhost:8000"
start "" "http://localhost:8000/admin.html"
py -m http.server 8000
goto :end

:end
pause
