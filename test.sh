#!/bin/bash

# Команда, результат выполнения которой проверяем
COMMAND="wb-rules /etc/wb-rules"

# Таймаут в секундах
TIMEOUT=5
START_TIME=$(date +%s)

# Запуск команды в фоне и чтение её вывода через дескриптор
exec 3< <($COMMAND 2>&1)
COMMAND_PID=$!

# Функция завершения команды
terminate_command() {
    if kill -0 $COMMAND_PID 2>/dev/null; then
        kill -SIGTERM $COMMAND_PID
        sleep 2  # Даем время на завершение
        if kill -0 $COMMAND_PID 2>/dev/null; then
            kill -SIGKILL $COMMAND_PID
        fi
    fi
}

# Чтение вывода команды в реальном времени
while kill -0 $COMMAND_PID 2>/dev/null; do
    # Проверяем вывод команды в реальном времени
    if IFS= read -r -t 1 line <&3; then
        echo "$line" # Вывод строки на консоль

        # Проверка строки
        if [[ "$line" == *"FAIL:"* || "$line" == *"couldn't load"* ]]; then
            echo -e "\033[31mTesting FAILED: $line\033[0m"  # Красное сообщение с причиной
            terminate_command
            exit 1
        fi

        # Проверка строки "all rule files are loaded"
        if [[ "$line" == *"all rule files are loaded"* ]]; then
            echo -e "\033[32mTesting SUCCESSFUL COMPLETED\033[0m"  # Зеленое сообщение
            terminate_command
            exit 0
        fi
    fi

    # Проверка на таймаут
    CURRENT_TIME=$(date +%s)
    if (( CURRENT_TIME - START_TIME >= TIMEOUT )); then
        echo -e "\033[31mTesting FAILED: Timeout exceeded\033[0m"  # Красное сообщение о таймауте
        terminate_command
        exit 1
    fi
done

# Если команда завершилась без вывода нужных строк
echo -e "\033[31mTesting FAILED: Command completed without 'all rule files are loaded'\033[0m"
terminate_command
exit 1
