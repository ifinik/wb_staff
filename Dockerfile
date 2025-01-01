# Stage 1: Node.js environment for ARM-compatible JavaScript test generation
FROM --platform=linux/arm/v7 node:18 as jsdoc-stage

# Устанавливаем рабочую директорию
WORKDIR /app

# Устанавливаем зависимости (если нужны)
RUN npm install doctrine

# Копируем необходимые файлы
COPY src /app/src
COPY test_gen.js /app/test_gen.js

# Выполняем JavaScript-скрипт для генерации и запуска тестов
RUN node test_gen.js

# Используем базовый образ
FROM debian:11

# Устанавливаем переменные среды
ENV DEBIAN_FRONTEND=noninteractive
ENV WB_RULES_MODULES=/etc/wb-rules-modules

# Устанавливаем необходимые утилиты и Mosquitto
RUN apt-get update && apt-get install -y \
    gnupg \
    mosquitto

# Настраиваем репозитории
RUN echo "deb http://deb.wirenboard.com/wb7/bullseye stable main" > /etc/apt/sources.list.d/wirenboard.list && \
    echo "deb http://debian-mirror.wirenboard.com/debian bullseye main" >> /etc/apt/sources.list.d/wirenboard.list && \
    echo "deb http://debian-mirror.wirenboard.com/debian bullseye-updates main" >> /etc/apt/sources.list.d/wirenboard.list && \
    echo "deb http://debian-mirror.wirenboard.com/debian bullseye-backports main" >> /etc/apt/sources.list.d/wirenboard.list && \
    echo "deb http://debian-mirror.wirenboard.com/debian-security bullseye-security main" >> /etc/apt/sources.list.d/wirenboard.list

# Копируем локальный ключ в образ
COPY wirenboard.gpg /tmp/wirenboard.gpg

# Добавляем ключ GPG
RUN apt-key add /tmp/wirenboard.gpg && rm /tmp/wirenboard.gpg

# Устанавливаем wb-rules
RUN apt-get update && apt-get install -y wb-rules

# Копируем конфигурацию Mosquitto
COPY mosquitto.conf /etc/mosquitto/mosquitto.conf

# Создаем рабочие директории
RUN mkdir -p /var/log/mosquitto /var/lib/mosquitto /var/lib/wirenboard/
RUN chmod -R 777 /var/log/mosquitto /var/lib/mosquitto /var/lib/wirenboard/

# Копируем запчасти тестового фремворка
COPY test.sh /etc/wb-rules/test.sh
RUN chmod +x /etc/wb-rules/test.sh

# Копируем сгенерированные тесты из первого стейджа
COPY --from=jsdoc-stage /app/generated-tests /etc/wb-rules

COPY src /etc/wb-rules-modules

WORKDIR /etc/wb-rules/

# Команда запуска MQTT-брокера и wb-rules
CMD mosquitto -c /etc/mosquitto/mosquitto.conf & sleep 5 & /etc/wb-rules/test.sh

# Раскомментировать для отладки
# CMD mosquitto -c /etc/mosquitto/mosquitto.conf & bash
