
import {
    defineConfig,
    devices
} from '@playwright/test';

export default defineConfig({
    testDir: './tests',

    // Тесты выполняются последовательно.
    fullyParallel: false,
    workers: 1,

    // Максимальное время одного теста.
    timeout: 30000,

    // Пока не повторяем упавшие тесты.
    retries: 0,

    // Отчёт в терминале и HTML.
    reporter: [
        ['list'],
        ['html', { open: 'never' }]
    ],

    use: {
        baseURL: 'http://localhost:5173',

        // Сохраняем данные для анализа ошибок.
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure'
    },

    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome']
            }
        }
    ]
});
