
import { useEffect, useState } from 'react';

import {
  Link,
  Navigate,
  Route,
  Routes
} from 'react-router';

import {
  getCurrentUser,
  logoutUser,
  type AuthUser
} from './auth/api';

import {
  LoginPage,
  RegisterPage
} from './auth/AuthPages';

type Meme = {
  id: number;
  title: string;
  author: string;
  emoji: string;
  likes: number;
  comments: number;
};

const memes: Meme[] = [
  {
    id: 1,
    title: 'Кот-программист',
    author: 'user123',
    emoji: '😺',
    likes: 124,
    comments: 18
  },
  {
    id: 2,
    title: 'Когда код заработал',
    author: 'developer',
    emoji: '💻',
    likes: 256,
    comments: 34
  },
  {
    id: 3,
    title: 'Понедельник утром',
    author: 'meme_master',
    emoji: '😂',
    likes: 89,
    comments: 12
  }
];

type HomePageProps = {
  user: AuthUser | null;
  onLogout: () => Promise<void>;
  logoutError: string;
};

function HomePage({
                    user,
                    onLogout,
                    logoutError
                  }: HomePageProps) {
  const [search, setSearch] = useState('');
  const [likedIds, setLikedIds] = useState<number[]>([]);

  const filteredMemes = memes.filter((meme) =>
      meme.title
          .toLowerCase()
          .includes(search.toLowerCase())
  );

  function toggleLike(id: number) {
    setLikedIds((previous) =>
        previous.includes(id)
            ? previous.filter((likedId) => likedId !== id)
            : [...previous, id]
    );
  }

  return (
      <div className="app">
        <header className="header">
          <Link to="/" className="logo">
            Memepedia
          </Link>

          <input
              className="search"
              type="search"
              placeholder="Поиск мемов..."
              aria-label="Поиск мемов"
              value={search}
              onChange={(event) =>
                  setSearch(event.target.value)
              }
          />

          <div className="home-actions">
            {user ? (
                <>
              <span className="home-username">
                {user.username}
              </span>

                  <button
                      className="home-link"
                      type="button"
                      onClick={() => void onLogout()}
                  >
                    Выйти
                  </button>
                </>
            ) : (
                <>
                  <Link className="home-link" to="/login">
                    Войти
                  </Link>

                  <Link
                      className="home-register"
                      to="/register"
                  >
                    Регистрация
                  </Link>
                </>
            )}
          </div>
        </header>

        <main className="main">
          <div className="page-heading">
            <h1>Популярные мемы</h1>

            <p>
              Самые интересные публикации сообщества
            </p>
          </div>

          {logoutError && (
              <p role="alert" className="auth-error">
                {logoutError}
              </p>
          )}

          {filteredMemes.length === 0 ? (
              <p className="empty-message">
                По вашему запросу ничего не найдено
              </p>
          ) : (
              <section
                  className="meme-grid"
                  aria-label="Лента мемов"
              >
                {filteredMemes.map((meme) => {
                  const isLiked = likedIds.includes(meme.id);

                  return (
                      <article
                          className="meme-card"
                          key={meme.id}
                      >
                        <div
                            className="meme-placeholder"
                            aria-hidden="true"
                        >
                          {meme.emoji}
                        </div>

                        <div className="meme-content">
                          <h2>{meme.title}</h2>

                          <p className="author">
                            Автор: {meme.author}
                          </p>

                          <div className="meme-stats">
                            <button
                                className="like-button"
                                type="button"
                                aria-pressed={isLiked}
                                onClick={() =>
                                    toggleLike(meme.id)
                                }
                            >
                              {isLiked ? '❤️' : '🤍'}{' '}
                              {meme.likes + Number(isLiked)}
                            </button>

                            <span>
                        💬 {meme.comments}
                      </span>
                          </div>
                        </div>
                      </article>
                  );
                })}
              </section>
          )}
        </main>

        <footer className="footer">
          Memepedia — учебный проект
        </footer>
      </div>
  );
}

export default function App() {
  const [user, setUser] =
      useState<AuthUser | null>(null);

  const [logoutError, setLogoutError] = useState('');

  useEffect(() => {
    let cancelled = false;

    getCurrentUser().then((currentUser) => {
      if (!cancelled) {
        setUser(currentUser);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    setLogoutError('');

    try {
      await logoutUser();
      setUser(null);
    } catch (error) {
      setLogoutError(
          error instanceof Error
              ? error.message
              : 'Не удалось выполнить выход.'
      );
    }
  }

  return (
      <Routes>
        <Route
            path="/"
            element={
              <HomePage
                  user={user}
                  onLogout={handleLogout}
                  logoutError={logoutError}
              />
            }
        />

        <Route
            path="/login"
            element={
              <LoginPage onLogin={setUser} />
            }
        />

        <Route
            path="/register"
            element={<RegisterPage />}
        />

        <Route
            path="*"
            element={<Navigate to="/" replace />}
        />
      </Routes>
  );
}
