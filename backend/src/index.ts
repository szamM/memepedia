
import 'dotenv/config';

import express, {
    type ErrorRequestHandler
} from 'express';

import helmet from 'helmet';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';

// Дополняем тип сессии собственными данными.
declare module 'express-session' {
    interface SessionData {
        userId?: number;
    }
}

type PublicUser = {
    id: number;
    username: string;
    email: string;
};

type DatabaseUser = PublicUser & {
    password_hash: string;
};

// Конфигурация приложения.
const PORT = Number(process.env.PORT ?? 3001);

const DATABASE_URL = process.env.DATABASE_URL;
const SESSION_SECRET = process.env.SESSION_SECRET;

const FRONTEND_ORIGIN =
    process.env.FRONTEND_ORIGIN ??
    'http://localhost:5173';

if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured');
}

if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
    throw new Error(
        'SESSION_SECRET must be at least 32 characters'
    );
}

// Подключение к PostgreSQL.
const pool = new Pool({
    connectionString: DATABASE_URL
});

pool.on('error', (error) => {
    console.error('PostgreSQL connection error:', error);
});

// Хранилище сессий в PostgreSQL.
const PgSessionStore = connectPgSimple(session);

const app = express();

app.disable('x-powered-by');

app.use(helmet());

app.use(express.json({
    limit: '20kb'
}));

// Базовая проверка источника запросов.
app.use('/api/auth', (req, res, next) => {
    if (
        req.method === 'GET' ||
        req.method === 'HEAD'
    ) {
        next();
        return;
    }

    const origin = req.get('origin');

    if (origin && origin !== FRONTEND_ORIGIN) {
        res.status(403).json({
            error: 'Недопустимый источник запроса'
        });
        return;
    }

    next();
});

// Сессии пользователей.
app.use(
    session({
        name: 'memepedia.sid',

        secret: SESSION_SECRET,

        store: new PgSessionStore({
            pool,
            createTableIfMissing: true
        }),

        resave: false,
        saveUninitialized: false,

        cookie: {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000
        }
    })
);

// Ограничение количества запросов авторизации.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        error: 'Слишком много запросов. Попробуйте позже.'
    }
});

// Валидация регистрации.
const registerSchema = z.object({
    username: z.string()
        .trim()
        .min(3)
        .max(32),

    email: z.string()
        .trim()
        .toLowerCase()
        .email()
        .max(254),

    password: z.string()
        .min(8)
        .refine(
            (value) =>
                Buffer.byteLength(value, 'utf8') <= 72,
            'Пароль слишком длинный'
        )
});

// Валидация входа.
const loginSchema = z.object({
    email: z.string()
        .trim()
        .toLowerCase()
        .email(),

    password: z.string().min(1)
});

// Проверка работоспособности сервера.
app.get('/api/health', async (_req, res) => {
    await pool.query('SELECT 1');

    res.json({
        status: 'ok',
        service: 'memepedia-backend'
    });
});

// Регистрация пользователя.
app.post(
    '/api/auth/register',
    authLimiter,
    async (req, res) => {
        const validation =
            registerSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({
                error: 'Некорректные данные регистрации'
            });
            return;
        }

        const {
            username,
            email,
            password
        } = validation.data;

        const passwordHash =
            await bcrypt.hash(password, 12);

        try {
            const result = await pool.query<PublicUser>(
                `
          INSERT INTO users (
            username,
            email,
            password_hash
          )
          VALUES ($1, $2, $3)
          RETURNING id, username, email
        `,
                [username, email, passwordHash]
            );

            res.status(201).json(result.rows[0]);
        } catch (error) {
            const databaseError = error as {
                code?: string;
            };

            if (databaseError.code === '23505') {
                res.status(409).json({
                    error: 'Email или имя пользователя уже заняты'
                });
                return;
            }

            throw error;
        }
    }
);

// Авторизация пользователя.
app.post(
    '/api/auth/login',
    authLimiter,
    async (req, res) => {
        const validation =
            loginSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({
                error: 'Некорректные данные входа'
            });
            return;
        }

        const { email, password } = validation.data;

        const result = await pool.query<DatabaseUser>(
            `
        SELECT id, username, email, password_hash
        FROM users
        WHERE LOWER(email) = $1
      `,
            [email]
        );

        const user = result.rows[0];

        if (!user) {
            res.status(401).json({
                error: 'Неверный email или пароль'
            });
            return;
        }

        const passwordMatches =
            await bcrypt.compare(
                password,
                user.password_hash
            );

        if (!passwordMatches) {
            res.status(401).json({
                error: 'Неверный email или пароль'
            });
            return;
        }

        // Предотвращаем повторное использование
        // старого идентификатора сессии.
        await new Promise<void>((resolve, reject) => {
            req.session.regenerate((error) => {
                if (error) reject(error);
                else resolve();
            });
        });

        req.session.userId = user.id;

        await new Promise<void>((resolve, reject) => {
            req.session.save((error) => {
                if (error) reject(error);
                else resolve();
            });
        });

        res.status(200).json({
            id: user.id,
            username: user.username,
            email: user.email
        });
    }
);

// Получение текущего пользователя.
app.get('/api/auth/me', async (req, res) => {
    const userId = req.session.userId;

    if (!userId) {
        res.status(401).json({
            error: 'Требуется авторизация'
        });
        return;
    }

    const result = await pool.query<PublicUser>(
        `
      SELECT id, username, email
      FROM users
      WHERE id = $1
    `,
        [userId]
    );

    const user = result.rows[0];

    if (!user) {
        res.status(401).json({
            error: 'Пользователь не найден'
        });
        return;
    }

    res.json(user);
});

// Завершение сессии.
app.post('/api/auth/logout', async (req, res) => {
    await new Promise<void>((resolve, reject) => {
        req.session.destroy((error) => {
            if (error) reject(error);
            else resolve();
        });
    });

    res.clearCookie('memepedia.sid', {
        path: '/'
    });

    res.status(204).send();
});

// Обработка непредвиденных ошибок.
const errorHandler: ErrorRequestHandler = (
    error,
    _req,
    res,
    next
) => {
    console.error('Backend error:', error);

    if (res.headersSent) {
        next(error);
        return;
    }

    res.status(500).json({
        error: 'Внутренняя ошибка сервера'
    });
};

app.use(errorHandler);

// Запуск сервера.
async function start() {
    await pool.query('SELECT 1');

    app.listen(PORT, () => {
        console.log(
            `Memepedia Backend: http://localhost:${PORT}`
        );
    });
}

void start().catch((error) => {
    console.error('Failed to start backend:', error);
    process.exitCode = 1;
});
