
export type AuthUser = {
    id: number;
    username: string;
    email: string;
};

export type RegisterData = {
    username: string;
    email: string;
    password: string;
};

export type LoginData = {
    email: string;
    password: string;
};

async function request<T>(
    url: string,
    method: 'GET' | 'POST',
    data?: object
): Promise<T> {
    let response: Response;

    try {
        response = await fetch(url, {
            method,
            credentials: 'include',
            headers: data
                ? { 'Content-Type': 'application/json' }
                : undefined,
            body: data ? JSON.stringify(data) : undefined
        });
    } catch {
        throw new Error(
            'Не удалось подключиться к серверу. ' +
            'Проверьте соединение и повторите попытку.'
        );
    }

    const text = await response.text();

    let result: unknown = null;

    if (text) {
        try {
            result = JSON.parse(text);
        } catch {
            result = null;
        }
    }

    if (!response.ok) {
        const errorData =
            result && typeof result === 'object'
                ? (result as {
                    error?: unknown;
                    message?: unknown;
                })
                : {};

        const message =
            typeof errorData.error === 'string'
                ? errorData.error
                : typeof errorData.message === 'string'
                    ? errorData.message
                    : `Ошибка сервера: ${response.status}`;

        throw new Error(message);
    }

    return result as T;
}

export function registerUser(
    data: RegisterData
): Promise<AuthUser> {
    return request<AuthUser>(
        '/api/auth/register',
        'POST',
        data
    );
}

export function loginUser(
    data: LoginData
): Promise<AuthUser> {
    return request<AuthUser>(
        '/api/auth/login',
        'POST',
        data
    );
}

export async function getCurrentUser():
    Promise<AuthUser | null> {
    try {
        return await request<AuthUser>(
            '/api/auth/me',
            'GET'
        );
    } catch {
        return null;
    }
}

export function logoutUser(): Promise<void> {
    return request<void>(
        '/api/auth/logout',
        'POST'
    );
}
