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
var rcm = require("rate");

var rateCalc = new rcm.RateCalculator({
  inputTopic: "wb-ms_146/Input 2 Counter",
  stopTopic: "wbe2-i-opentherm_11/Boiler Flame Status",
  deviceName: "GasRate",
  deviceTitle: "Текущее потребелени газа",
  outputTopic: {
    rate: {
      type: "value",
      value: 0,
      precision: 3,
      unit: "m^3/h",
      title: "За 10 минут"
    }
  },
  bufferSize: 600, // 10 минут
  multiplier: 0.006, // 100 импульсов на куб и 6 десятиминуток в часе
  stopCondition: function(newValue) {
    return newValue === 0; // Горелка погасла
  }
});
```
## Лицензия

Этот модуль предоставляется "как есть". Автор не несёт ответственности за возможный ущерб, вызванный использованием модуля.
