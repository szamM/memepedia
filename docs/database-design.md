
# Memepedia — проектирование базы данных и API

## 1. Основные сущности

### User
- id — идентификатор пользователя
- username — имя пользователя
- email — электронная почта
- password_hash — хеш пароля
- created_at — дата регистрации

### Meme
- id — идентификатор мема
- author_id — автор
- title — название
- image_url — ссылка на изображение
- created_at — дата публикации

### Comment
- id — идентификатор комментария
- meme_id — идентификатор мема
- author_id — автор комментария
- content — текст комментария

### Like
- user_id — идентификатор пользователя
- meme_id — идентификатор мема

## 2. Связи между сущностями

- User 1:N Meme
- User 1:N Comment
- Meme 1:N Comment
- User N:M Meme через Like

## 3. Основные REST API

- POST /api/auth/register
- POST /api/auth/login
- GET /api/memes
- POST /api/memes
- GET /api/memes/:id
- GET /api/users/:id

## 4. Используемые технологии

- Backend: Node.js + Express
- Database: PostgreSQL
- API: REST
- Авторизация: JWT
