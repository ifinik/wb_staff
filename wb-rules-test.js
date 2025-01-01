/****************************************************
 * wb-rules-test.js
 *
 * Запуск тестов из JSONC файлов.
 ****************************************************/

function deepEqual(actual, expected) {
    if (actual === expected) {
        return true; // Если значения идентичны (включая примитивы)
    }

    if (
        typeof actual !== "object" ||
        typeof expected !== "object" ||
        actual === null ||
        expected === null
    ) {
        return false; // Если одно из значений не объект или одно из них null
    }

    // Получаем ключи обоих объектов
    var actualKeys = Object.keys(actual);
    var expectedKeys = Object.keys(expected);

    // Проверяем, одинаковое ли количество ключей
    if (actualKeys.length !== expectedKeys.length) {
        return false;
    }

    // Проверяем наличие и равенство всех ключей и их значений
    for (var i in actualKeys) {
        if (!expected.hasOwnProperty(actualKeys[i]) || !deepEqual(actual[actualKeys[i]], expected[actualKeys[i]])) {
            return false;
        }
    }

    return true;
}

// Обновленная версия assertEqual
function assertEqual(actual, expected, testName) {
    if (deepEqual(actual, expected)) {
        log.info("PASS: {}", testName);
    } else {
        log.error("FAIL: {} => actual: {}, expected: {}", testName,  JSON.stringify(actual), JSON.stringify(expected));
    }
}

function runAllTests(testDir) {
    var bashCmd = "find {} -type f -name \"*.jsonc\"".format(testDir);
    spawn("/bin/sh", ["-c", bashCmd], {
        captureOutput: true,
        exitCallback: function (exitCode, capturedOutput) {
            if (exitCode !== 0) {
                log.error("FAIL: finding test files in directory: {}", testDir);
                return;
            }

            var testFiles = capturedOutput.trim().split("\n");
            testFiles.forEach(function (file) {
                if (!file) return;
                log.info("Processing test file: {}", file);

                try {
                    // Чтение JSON-файла
                    var testConfig = readConfig(file);

                    // Обработка каждого модуля в тестовом файле
                    for (var moduleName in testConfig) {
                        log.info("Testing module: {}", moduleName);

                        // Подключаем модуль
                        var module = require(moduleName);

                        // Обработка функций в модуле
                        var moduleTests = testConfig[moduleName];
                        for (var functionName in moduleTests) {
                            log.info("Testing function: {}.{}", moduleName, functionName);

                            var testCases = moduleTests[functionName];
                            testCases.forEach(function (testCase, index) {
                                var args = testCase[0];
                                var expected = testCase[1];

                                try {
                                    assertEqual(module[functionName].apply(null, args), expected, functionName)
                                } catch (error) {
                                    log.error("FAIL: {}.{} test #{} threw an exception with args {}: {}", moduleName, functionName, index + 1, JSON.stringify(args), error.message);
                                }
                            });
                        }
                    }
                } catch (err) {
                    log.error("FAIL: Failed to process file {}: {}", file, err.message);
                 }
            });
            log.info("Testing ended");
        },
    });
}
runAllTests("/etc/tests");
