
CREATE TABLE IF NOT EXISTS users (
                                     id SERIAL PRIMARY KEY,
                                     username VARCHAR(32) NOT NULL,
    email VARCHAR(254) NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

CREATE UNIQUE INDEX IF NOT EXISTS
    users_username_lower_unique
    ON users (LOWER(username));

CREATE UNIQUE INDEX IF NOT EXISTS
    users_email_lower_unique
    ON users (LOWER(email));
