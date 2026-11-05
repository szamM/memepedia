
import { useState } from 'react';

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

export default function App() {
  const [search, setSearch] = useState('');
  const [likedIds, setLikedIds] = useState<number[]>([]);

  const filteredMemes = memes.filter((meme) =>
    meme.title.toLowerCase().includes(search.toLowerCase())
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
        <a className="logo" href="/">
          Memepedia
        </a>

        <input
          className="search"
          type="search"
          placeholder="Поиск мемов..."
          aria-label="Поиск мемов"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <button className="publish-button" type="button" disabled>
          Добавить мем
        </button>
      </header>

      <main className="main">
        <div className="page-heading">
          <h1>Популярные мемы</h1>
          <p>Самые интересные публикации сообщества</p>
        </div>

        {filteredMemes.length === 0 ? (
          <p className="empty-message">
            По вашему запросу ничего не найдено
          </p>
        ) : (
          <section className="meme-grid" aria-label="Лента мемов">
            {filteredMemes.map((meme) => {
              const isLiked = likedIds.includes(meme.id);

              return (
                <article className="meme-card" key={meme.id}>
                  <div className="meme-placeholder" aria-hidden="true">
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
                        onClick={() => toggleLike(meme.id)}
                      >
                        {isLiked ? '❤️' : '🤍'}{' '}
                        {meme.likes + Number(isLiked)}
                      </button>

                      <span>💬 {meme.comments}</span>
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
