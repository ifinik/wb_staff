/*
 * Как подличть и позвать модуль в другом файле
 * 1. Импортируем модуль
 * const math = require('./math');
 * math.add(1, 2)
*/

function add (a, b) {
    return a + b;
};

function multiply (a, b) {
    return a * b;
};

// Экспортируем функции через объект export
exports.add = add;
exports.multiply = multiply;
