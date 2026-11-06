
import {
    test,
    expect
} from '@playwright/test';

test.describe('Memepedia — авторизация', () => {

    test('TC-005: главная страница и навигация', async ({
                                                            page
                                                        }) => {
        await page.goto('/');

        await expect(
            page.getByRole('heading', {
                name: 'Популярные мемы'
            })
        ).toBeVisible();

        await expect(
            page.getByText('Кот-программист')
        ).toBeVisible();

        await page.getByRole('link', {
            name: 'Регистрация'
        }).click();

        await expect(page).toHaveURL(/\/register$/);

        await expect(
            page.getByRole('heading', {
                name: 'Создать аккаунт'
            })
        ).toBeVisible();
    });

    test('TC-004: проверка некорректного входа', async ({
                                                            page
                                                        }) => {
        await page.goto('/login');

        await page.getByRole('button', {
            name: 'Войти'
        }).click();

        await expect(
            page.getByRole('alert')
        ).toContainText('Введите корректный email');

        await page.getByLabel(
            'Электронная почта'
        ).fill('test@example.com');

        await page.getByRole('button', {
            name: 'Войти'
        }).click();

        await expect(
            page.getByRole('alert')
        ).toContainText('Введите пароль');
    });

    test('Регистрация: пароли не совпадают', async ({
                                                        page
                                                    }) => {
        await page.goto('/register');

        await page.getByLabel(
            'Имя пользователя'
        ).fill('qa_user');

        await page.getByLabel(
            'Электронная почта'
        ).fill('qa@example.com');

        await page.getByLabel(
            'Пароль',
            { exact: true }
        ).fill('Password123');

        await page.getByLabel(
            'Подтвердите пароль'
        ).fill('Password456');

        await page.getByRole('button', {
            name: 'Зарегистрироваться'
        }).click();

        await expect(
            page.getByRole('alert')
        ).toContainText('Пароли не совпадают');
    });

    test('Успешная регистрация, вход и выход', async ({
                                                          page
                                                      }) => {
        // Уникальные данные для каждого запуска.
        const suffix = Date.now().toString();

        const username = `qa_${suffix}`;
        const email = `qa_${suffix}@example.com`;
        const password = 'Password123';

        await page.goto('/register');

        await page.getByLabel(
            'Имя пользователя'
        ).fill(username);

        await page.getByLabel(
            'Электронная почта'
        ).fill(email);

        await page.getByLabel(
            'Пароль',
            { exact: true }
        ).fill(password);

        await page.getByLabel(
            'Подтвердите пароль'
        ).fill(password);

        await page.getByRole('button', {
            name: 'Зарегистрироваться'
        }).click();

        // После регистрации открывается вход.
        await expect(page).toHaveURL(/\/login$/);

        await expect(
            page.getByRole('status')
        ).toContainText('Регистрация прошла успешно');

        await page.getByLabel(
            'Электронная почта'
        ).fill(email);

        await page.getByLabel(
            'Пароль'
        ).fill(password);

        await page.getByRole('button', {
            name: 'Войти'
        }).click();

        // Пользователь попадает на главную.
        await expect(page).toHaveURL('/');

        await expect(
            page.getByText(username, {
                exact: true
            })
        ).toBeVisible();

        // Проверяем сохранение сессии.
        await page.reload();

        await expect(
            page.getByText(username, {
                exact: true
            })
        ).toBeVisible();

        // Выход из аккаунта.
        await page.getByRole('button', {
            name: 'Выйти'
        }).click();

        await expect(
            page.getByRole('link', {
                name: 'Войти'
            })
        ).toBeVisible();
    });

    test('Имя пользователя короче 3 символов', async ({
                                                          page
                                                      }) => {
        await page.goto('/register');

        await page.getByLabel(
            'Имя пользователя'
        ).fill('ab');

        await page.getByLabel(
            'Электронная почта'
        ).fill('short_username@example.com');

        await page.getByLabel(
            'Пароль',
            { exact: true }
        ).fill('Password123');

        await page.getByLabel(
            'Подтвердите пароль'
        ).fill('Password123');

        await page.getByRole('button', {
            name: 'Зарегистрироваться'
        }).click();

        // Ожидаем понятную ошибку валидации.
        await expect(
            page.getByRole('alert')
        ).toContainText('не менее 3 символов');
    });

});
