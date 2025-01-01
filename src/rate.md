# RateCalculator

**RateCalculator** — модуль для расчёта средней скорости изменения значения (rate) из входных MQTT-топиков. Модуль предназначен для использования в системе Wiren Board.

## Установка

1. Скопируйте файл `rate.js` в директорию с модулями вашего проекта.
2. Подключите модуль в файле с правилами.

## Использование

### Импорт модуля

```js
var rcm = require("rate");
```

### Создание нового объекта RateCalculator

```js
const rateCalc = new rcm.RateCalculator({
  inputTopic: "sensor/counter", // Входной топик
  stopTopic: "sensor/stop", // Топик для остановки
  deviceName: "rateCalculatorDevice", // Имя виртуального устройства
  deviceTitle: "Rate Calculator Device", // Заголовок виртуального устройства
  outputTopic: {
    rate: {
      type: "value",
      value: 0,
      precision: 3
    }
  }, // Топики для результата
  bufferSize: 300, // Окно расчёта (по умолчанию 300 секунд)
  timeout: 600, // Таймаут ожидания (по умолчанию 2 * bufferSize)
  stopCondition: function(newValue) {
    return newValue === "stop"; // Событие остановки
  }
});

## Лицензия

Этот модуль предоставляется "как есть". Автор не несёт ответственности за возможный ущерб, вызванный использованием модуля.
