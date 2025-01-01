/**
 * Добавляет новую точку данных в буфер.
 * @param {Array} buffer - Текущий буфер данных.
 * @param {number} time - Временная метка.
 * @param {number} value - Значение счётчика.
 * @param {number} bufferSize - Максимальный размер окна в секундах.
 * @returns {Array} Обновлённый буфер данных.
 *
 * @example
 * addToBuffer([], 100, 10, 300) // [{ time: 100, value: 10 }]
 * @example
 * addToBuffer([{ time: 50, value: 5 }], 100, 10, 300)
 * // [{ time: 50, value: 5 }, { time: 100, value: 10 }]
 */
function addToBuffer(buffer, time, value, bufferSize) {
    var updatedBuffer = buffer.concat({ time: time, value: value });
    return updatedBuffer.filter(function (point) {
        return time - point.time <= bufferSize;
    });
}

/**
 * Рассчитывает среднюю скорость изменения значения (rate).
 * @param {Array} buffer - Буфер временных меток и значений.
 * @returns {number} Средняя скорость изменения или 0, если данных недостаточно.
 *
 * @example
 * calculateRate([{ time: 100, value: 10 }, { time: 200, value: 20 }]) // 0.1
 * @example
 * calculateRate([{ time: 100, value: 10 }]) // 0
 * @example
 * calculateRate([{ time: 100, value: 10 }, { time: 200, value: 20 }, { time: 300, value: 10 }]) // 0.1
 */
function calculateRate(buffer) {
    if (buffer.length < 2) {
        return 0;
    }

    var totalDiff = 0;
    var totalTime = buffer[buffer.length - 1].time - buffer[0].time;

    for (var i = 1; i < buffer.length; i++) {
        var prev = buffer[i - 1];
        var curr = buffer[i];
        totalDiff += curr.value >= prev.value
            ? curr.value - prev.value
            : curr.value;
    }

    return totalTime > 0 ? totalDiff / totalTime : 0;
}

/**
 * Сбрасывает таймер и устанавливает новый.
 * @param {number|null} timer - Идентификатор текущего таймера.
 * @param {function} callback - Функция обратного вызова для нового таймера.
 * @param {number} timeout - Время тайм-аута в миллисекундах.
 * @returns {number} Идентификатор нового таймера.
 *
 * @example
 * resetTimer(null, function () { log("Timeout"); }, 1000) != 0 // true
 */
function resetTimer(timer, callback, timeout) {
    if (timer) {
        clearTimeout(timer);
    }
    return setTimeout(callback, timeout);
}
/**
 * Создает новый объект RateCalculator.
 * @param {Object} config - Объект настроек для RateCalculator.
 * @returns {Object|null} Объект RateCalculator или null, если настройки неверны.
 *
 * @example
 * (new RateCalculator({
 * inputTopic: "sensor/counter",
 * stopTopic: "sensor/stop",
 * deviceName: "rateCalculatorDevice",
 * deviceTitle: "Rate Calculator Device",
 * outputTopic: {
 *       rate: {
 *         type: "value",
 *         value: 0,
 *         precision: 3
 *       }
 *     },
 * bufferSize: 300,
 * timeout: 600,
 * stopCondition: function(newValue) {
 *   return newValue === "stop";
 * }
 * })) != null // true
 */
function RateCalculator(config) {
    // Проверяем настройки
    if (!config.inputTopic || !config.stopTopic || !config.deviceName || !config.deviceTitle || !config.outputTopic || !config.stopCondition) {
        throw new Error("inputTopic, stopTopic, deviceName, deviceTitle, outputTopic и stopCondition обязательны для настройки модуля.");
    }

    // Настройки модуля
    var bufferSize = config.bufferSize || 300;
    var timeout = config.timeout || 2 * bufferSize;
    var inputTopic = config.inputTopic;
    var stopTopic = config.stopTopic;
    var stopCondition = config.stopCondition;
    var deviceName = config.deviceName;
    var deviceTitle = config.deviceTitle;
    var outputTopic = config.outputTopic;

    // Внутренние переменные
    var buffer = [];
    var noDataTimer = null;
    var topic = deviceTitle + "/" + Object.keys(outputTopic)[0];
    // Виртуальное устройство для публикации результата
    defineVirtualDevice(deviceName, {
        title: deviceTitle,
        cells: outputTopic
    });

    /**
     * Обновляет результат в виртуальном устройстве.
     */
    function updateRate() {
        var rate = calculateRate(buffer);
        dev[topic] = rate * bufferSize;
    }

    // Правило обработки данных из inputTopic
    defineRule(deviceName + "_rateCalculation", {
        whenChanged: inputTopic,
        then: function (newValue) {
            var currentValue = parseInt(newValue, 10);
            var currentTime = Date.now() / 1000;

            // Обновляем буфер
            buffer = addToBuffer(buffer, currentTime, currentValue, bufferSize);

            // Перезапускаем таймер
            noDataTimer = resetTimer(noDataTimer, function () {
                dev[topic] = 0;
            }, timeout * 1000);

            // Обновляем `rate`
            updateRate();
        }
    });

    // Правило обработки событий из stopTopic
    defineRule(deviceName + "_stopEvent", {
        whenChanged: stopTopic,
        then: function (newValue) {
            if (stopCondition(newValue)) {
                dev[topic] = 0;
                buffer = [];

                if (noDataTimer) {
                    clearTimeout(noDataTimer);
                    noDataTimer = null;
                }
            }
        }
    });
};

// Экспортируем функции для тестирования
exports.addToBuffer = addToBuffer;
exports.calculateRate = calculateRate;
exports.resetTimer = resetTimer;
exports.RateCalculator = RateCalculator;
