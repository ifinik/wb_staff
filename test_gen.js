const fs = require('fs');
const path = require('path');
const doctrine = require('doctrine');

/**
 * Рекурсивно ищет все файлы с указанным расширением в директории.
 */
function findFiles(dir, ext) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = entries
        .filter(file => !file.isDirectory() && file.name.endsWith(ext))
        .map(file => path.join(dir, file.name));
    const folders = entries.filter(folder => folder.isDirectory());
    for (const folder of folders) {
        files.push(...findFiles(path.join(dir, folder.name), ext));
    }
    return files;
}

/**
 * Извлечение примеров из JSDoc.
 */
function extractExamplesFromFile(filePath) {
    const code = fs.readFileSync(filePath, 'utf8');
    const jsdocRegex = /\/\*\*([\s\S]*?)\*\//g;
    let match;
    const examples = [];
    while ((match = jsdocRegex.exec(code)) !== null) {
        const parsed = doctrine.parse(match[1], { unwrap: true });
        const exampleTags = parsed.tags.filter(tag => tag.title === 'example');
        exampleTags.forEach(tag => examples.push(tag.description));
    }
    return examples;
}

/**
 * Генерация JavaScript кода для тестов.
 */
function generateExecutableJS(relativePath, examples) {
    const helpers = `
function deepEqual(actual, expected) {
    if (actual === expected) {
        return true;
    }
    if (
        typeof actual !== "object" ||
        typeof expected !== "object" ||
        actual === null ||
        expected === null
    ) {
        return false;
    }
    var actualKeys = Object.keys(actual);
    var expectedKeys = Object.keys(expected);
    if (actualKeys.length !== expectedKeys.length) {
        return false;
    }
    for (var i in actualKeys) {
        if (!expected.hasOwnProperty(actualKeys[i]) || !deepEqual(actual[actualKeys[i]], expected[actualKeys[i]])) {
            return false;
        }
    }
    return true;
}

function assertEqual(actual, expected, testName) {
    if (deepEqual(actual, expected)) {
        log.info("PASS: {} in {}", testName, "${relativePath}");
    } else {
        log.error("FAIL: {} actual: {} expected: {} in {}", testName, JSON.stringify(actual), JSON.stringify(expected),"${relativePath}")
    }
}
global.assertEqual = assertEqual;
`;

    var tests = examples.map((example, index) => {
        // Разбиваем строку по "//" для отделения кода от ожидаемого значения
        const parts = example.split('//');
        if (parts.length !== 2) {
            console.error(parts)
            console.error("Invalid @example format in example: " + example);
            return '';
        }
        const code = parts[0].trim(); // Код теста
        const expected = parts[1].trim(); // Ожидаемое значение
        return `
    // Test case ${index + 1}
    assertEqual(${code}, ${expected}, "Test ${index + 1}");
    `;
    }).join('\n');

    if (tests.length > 0) {
        tests = `log.info("Start JsDoc testing ${relativePath} in file", module.filename)\n` + tests;
    }
    return `
${helpers}

// Import the module and expose all exports globally
var requiredModule = require("${relativePath}");

// Run tests if exists

if (requiredModule["tests"]){
    log("Starts tests function in {}", "${relativePath}")
    requiredModule.tests()
    log("PASS: function tests in {}", "${relativePath}")
}

Object.keys(requiredModule).forEach(function (key) {
    global[key] = requiredModule[key];
});

// Generated tests
${tests}
    `;
}

/**
 * Генерация тестов для всех файлов в папке.
 */
function processFiles(inputDir, outputDir) {
    const files = findFiles(inputDir, '.js');
    console.log(`Found ${files.length} JavaScript files in ${inputDir}.`);
    files.forEach(function (file) {
        const relativePath = path.relative(inputDir, file).replace('.js', '');
        const fileName = path.basename(file, '.js');
        const examples = extractExamplesFromFile(file);
        const generatedCode = generateExecutableJS(relativePath, examples);
        const outputFilePath = path.join(outputDir, fileName + '-tests.js');
        fs.writeFileSync(outputFilePath, generatedCode);
        if (examples.length > 0) {
            console.log('Generated tests for ' + file + ' -> ' + outputFilePath);
        } else {
            console.log('No @example tags found in ' + file + '.');
        }
    });
}

// Конфигурация
const inputDir = '/app/src'; // Папка с исходным кодом
const outputDir = '/app/generated-tests'; // Папка для сохранения тестов

// Создаём выходную директорию, если её нет
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Обрабатываем файлы
processFiles(inputDir, outputDir);

console.log('Test generation complete.');
