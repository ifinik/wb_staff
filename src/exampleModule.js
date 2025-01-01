/*
 * Как подличть и позвать модуль в другом файле
 * 1. Импортируем модуль
 * const math = require('./math');
 * math.add(1, 2)
*/

/**
 * Adds two numbers.
 * @param {number} a - First number.
 * @param {number} b - Second number.
 * @returns {number} Sum of a and b.
 *
 * @example
 * add(2, 3) // 5
 * @example
 * add(10, -5) // 5
 */
function add(a, b) {
    return a + b;
}


/**
 * Adds two numbers.
 * @param {number} a - First number.
 * @param {number} b - Second number.
 * @returns {number} multiply of a and b.
 * @example
 * multiply(2, 3) // 6
 * @example
 * -1 * multiply(10, -5) // 50
 */
function multiply (a, b) {
    return a * b;
};

// Экспортируем функции через объект export
exports.add = add;
exports.multiply = multiply;
