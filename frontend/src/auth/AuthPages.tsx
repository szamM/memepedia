
import {
    useState,
    type FormEvent,
    type ReactNode
} from 'react';

import {
    Link,
    useLocation,
    useNavigate
} from 'react-router';

import {
    loginUser,
    registerUser,
    type AuthUser
} from './api';

import './auth.css';

type AuthLayoutProps = {
    title: string;
    description: string;
    children: ReactNode;
};

function AuthLayout({
                        title,
                        description,
                        children
                    }: AuthLayoutProps) {
    return (
        <main className="auth-page">
            <div className="auth-layout">
                <aside className="auth-intro">
                    <Link to="/" className="auth-logo">
                        Memepedia
                    </Link>

                    <div>
                        <h2>Твоя коллекция лучших мемов</h2>
                        <p>
                            Сохраняй любимые публикации,
                            общайся и делись мемами
                            с другими пользователями.
                        </p>
                    </div>

                    <span>Memepedia — пространство мемов</span>
                </aside>

                <section className="auth-panel">
                    <h1>{title}</h1>
                    <p className="auth-description">
                        {description}
                    </p>

                    {children}
                </section>
            </div>
        </main>
    );
}

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

type LoginPageProps = {
    onLogin: (user: AuthUser) => void;
};

export function LoginPage({
                              onLogin
                          }: LoginPageProps) {
    const navigate = useNavigate();
    const location = useLocation();

    const registered = Boolean(
        (
            location.state as {
                registered?: boolean;
            } | null
        )?.registered
    );

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();
        setError('');

        if (!isValidEmail(email.trim())) {
            setError('Введите корректный email.');
            return;
        }

        if (!password) {
            setError('Введите пароль.');
            return;
        }

        setIsLoading(true);

        try {
            const user = await loginUser({
                email: email.trim(),
                password
            });

            onLogin(user);
            navigate('/');
        } catch (caughtError) {
            setError(
                caughtError instanceof Error
                    ? caughtError.message
                    : 'Не удалось выполнить вход.'
            );
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <AuthLayout
            title="Вход в аккаунт"
            description="Введи email и пароль, чтобы продолжить."
        >
            {registered && (
                <p className="auth-success" role="status">
                    Регистрация прошла успешно.
                    Теперь войдите в аккаунт.
                </p>
            )}

            <form
                className="auth-form"
                onSubmit={handleSubmit}
                noValidate
            >
                <label className="auth-field">
                    <span>Электронная почта</span>

                    <input
                        type="email"
                        autoComplete="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(event) =>
                            setEmail(event.target.value)
                        }
                        disabled={isLoading}
                        required
                    />
                </label>

                <label className="auth-field">
                    <span>Пароль</span>

                    <input
                        type="password"
                        autoComplete="current-password"
                        placeholder="Введите пароль"
                        value={password}
                        onChange={(event) =>
                            setPassword(event.target.value)
                        }
                        disabled={isLoading}
                        required
                    />
                </label>

                {error && (
                    <p className="auth-error" role="alert">
                        {error}
                    </p>
                )}

                <button
                    className="auth-submit"
                    type="submit"
                    disabled={isLoading}
                >
                    {isLoading ? 'Выполняется вход...' : 'Войти'}
                </button>
            </form>

            <p className="auth-switch">
                Ещё нет аккаунта?{' '}
                <Link to="/register">
                    Зарегистрироваться
                </Link>
            </p>
        </AuthLayout>
    );
}

export function RegisterPage() {
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] =
        useState('');

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();
        setError('');

        if (!username.trim()) {
            setError('Введите имя пользователя.');
            return;
        }

        if (username.trim().length < 3) {
            setError(
                'Имя пользователя должно содержать не менее 3 символов.'
            );
            return;
        }


        if (!isValidEmail(email.trim())) {
            setError('Введите корректный email.');
            return;
        }

        if (password.length < 8) {
            setError(
                'Пароль должен содержать не менее 8 символов.'
            );
            return;
        }

        if (password !== confirmPassword) {
            setError('Пароли не совпадают.');
            return;
        }

        setIsLoading(true);

        try {
            await registerUser({
                username: username.trim(),
                email: email.trim(),
                password
            });

            navigate('/login', {
                state: { registered: true }
            });
        } catch (caughtError) {
            setError(
                caughtError instanceof Error
                    ? caughtError.message
                    : 'Не удалось зарегистрироваться.'
            );
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <AuthLayout
            title="Создать аккаунт"
            description="Заполни форму, чтобы присоединиться к Memepedia."
        >
            <form
                className="auth-form"
                onSubmit={handleSubmit}
                noValidate
            >
                <label className="auth-field">
                    <span>Имя пользователя</span>

                    <input
                        type="text"
                        autoComplete="username"
                        placeholder="Придумайте имя"
                        value={username}
                        onChange={(event) =>
                            setUsername(event.target.value)
                        }
                        disabled={isLoading}
                        required
                    />
                </label>

                <label className="auth-field">
                    <span>Электронная почта</span>

                    <input
                        type="email"
                        autoComplete="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(event) =>
                            setEmail(event.target.value)
                        }
                        disabled={isLoading}
                        required
                    />
                </label>

                <label className="auth-field">
                    <span>Пароль</span>

                    <input
                        type="password"
                        autoComplete="new-password"
                        placeholder="Минимум 8 символов"
                        value={password}
                        onChange={(event) =>
                            setPassword(event.target.value)
                        }
                        disabled={isLoading}
                        required
                    />
                </label>

                <label className="auth-field">
                    <span>Подтвердите пароль</span>

                    <input
                        type="password"
                        autoComplete="new-password"
                        placeholder="Повторите пароль"
                        value={confirmPassword}
                        onChange={(event) =>
                            setConfirmPassword(event.target.value)
                        }
                        disabled={isLoading}
                        required
                    />
                </label>

                {error && (
                    <p className="auth-error" role="alert">
                        {error}
                    </p>
                )}

                <button
                    className="auth-submit"
                    type="submit"
                    disabled={isLoading}
                >
                    {isLoading
                        ? 'Создание аккаунта...'
                        : 'Зарегистрироваться'}
                </button>
            </form>

            <p className="auth-switch">
                Уже есть аккаунт?{' '}
                <Link to="/login">Войти</Link>
            </p>
        </AuthLayout>
    );
}
