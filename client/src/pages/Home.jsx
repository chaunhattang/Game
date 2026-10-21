import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LazyMotion, m, useReducedMotion } from 'motion/react';
import {
  Search,
  ArrowUpRight,
  ArrowRight,
  Users,
  Globe,
  Gamepad2,
  Sparkles,
  Trophy,
  Monitor,
  ChevronRight,
} from 'lucide-react';
import { games } from '../../../shared/catalog';
import Artwork from '../components/common/Artwork';
import { useData } from '../hooks/useData';
const loadMotionFeatures = () =>
  import('../utils/motion-features').then((module) => module.default);
export default function Home() {
  const reducedMotion = useReducedMotion();
  const [search, setSearch] = useState(''),
    [category, setCategory] = useState('All games'),
    [mode, setMode] = useState('All modes');
  const { data: leaders, error } = useData('/leaderboard');
  const filtered = games.filter(
    (g) =>
      (category === 'All games' || g.category === category) &&
      g.name.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <>
      <div className="welcome-line">
        <span>
          <span className="live-dot" /> YOUR NEXT RIVALRY STARTS HERE
        </span>
        <span>
          Less scrolling. More playing. <Gamepad2 size={15} />
        </span>
      </div>
      <section className="hero">
        <div className="hero-copy">
          <div className="pill">
            <Sparkles size={13} /> MULTIPLAYER. MINUS THE COMPLICATED.
          </div>
          <h1>
            Better together.
            <br />
            <span>Better as rivals.</span>
          </h1>
          <p>
            Big competition. Bite-sized games. Grab a friend and turn “one more round” into your new
            favorite tradition.
          </p>
          <div className="hero-buttons">
            <a className="button" href="#games">
              Find your game <ArrowRight size={17} />
            </a>
            <Link className="button secondary" to="/play/tictactoe/online">
              <Users size={17} /> Create a room
            </Link>
          </div>
          <div className="hero-trust">
            <span>
              <Monitor size={14} /> Same screen
            </span>
            <span>
              <Globe size={14} /> Different worlds
            </span>
            <span className="no-download">Zero downloads</span>
          </div>
        </div>
        <div className="hero-visual">
          <span className="floating-label top">
            <span className="live-dot" /> FRIENDLY COMPETITION, SERIOUS FUN
          </span>
          <Artwork id="gravity" hero />
          <div className="floating-label bottom">
            <span className="versus-avatar purple">P1</span>
            <b>VS</b>
            <span className="versus-avatar cyan">P2</span>
            <span>
              Your friend.
              <br />
              <strong>Your favorite rival.</strong>
            </span>
          </div>
        </div>
      </section>
      <section className="quick-modes">
        <Link to="/games/pong">
          <div className="mode-icon purple">
            <Monitor />
          </div>
          <div>
            <strong>One screen. Twice the fun.</strong>
            <p>Local multiplayer, just like the good old days.</p>
          </div>
          <ArrowUpRight size={21} />
        </Link>
        <Link to="/play/tictactoe/online">
          <div className="mode-icon cyan">
            <Globe />
          </div>
          <div>
            <strong>Far apart. Game on.</strong>
            <p>Create a private room and share the code.</p>
          </div>
          <ArrowUpRight size={21} />
        </Link>
      </section>
      <section id="games" className="games-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">PICK YOUR BATTLE</span>
            <h2>
              The game is on<span className="muted-dot">.</span>{' '}
              <span className="count-badge">{games.length} games</span>
            </h2>
          </div>
          <label className="search-box">
            <Search size={17} />
            <input
              aria-label="Search games"
              placeholder="Find your next obsession…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <kbd>/</kbd>
          </label>
        </div>
        <div className="filter-row">
          <div className="tabs">
            {['All games', 'Strategy', 'Arcade', 'Action', 'Racing'].map((c) => (
              <button
                key={c}
                className={c === category ? 'active' : ''}
                onClick={() => setCategory(c)}
              >
                {c === 'All games' && <LayoutIcon />}
                {c}
              </button>
            ))}
          </div>
          <select
            aria-label="Filter game mode"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option>All modes</option>
            <option>Local multiplayer</option>
            <option>Online multiplayer</option>
          </select>
        </div>
        <LazyMotion features={loadMotionFeatures} strict>
          <div className="game-grid">
            {filtered.map((g, i) => (
              <m.article
                className="game-card"
                key={g.id}
                initial={reducedMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.035 }}
              >
                <Link to={`/games/${g.id}`} className="card-art">
                  <Artwork id={g.id} />
                  <span className="card-category">{g.category}</span>
                  {g.id === 'pong' && (
                    <span className="popular">
                      <Sparkles size={11} /> FAN FAVORITE
                    </span>
                  )}
                  <span className="art-arrow">
                    <ArrowUpRight size={21} />
                  </span>
                </Link>
                <div className="card-body">
                  <div className="card-title">
                    <h3>
                      <Link to={`/games/${g.id}`}>{g.name}</Link>
                    </h3>
                    <span className="difficulty">
                      <i style={{ background: g.accent }} />
                      {g.difficulty}
                    </span>
                  </div>
                  <p>{g.tagline}</p>
                  <div className="card-bottom">
                    <div className="game-modes">
                      <span>
                        <Monitor size={12} /> Local
                      </span>
                      <span>
                        <Globe size={12} /> Online
                      </span>
                    </div>
                    <Link
                      className="play-link"
                      to={`/play/${g.id}/${mode === 'Online multiplayer' ? 'online' : 'local'}`}
                    >
                      Play now <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </m.article>
            ))}
          </div>
        </LazyMotion>
        {!filtered.length && (
          <div className="empty">
            <h3>No games found</h3>
            <p>Try a different name or category.</p>
            <button
              className="button secondary"
              onClick={() => {
                setSearch('');
                setCategory('All games');
              }}
            >
              Reset filters
            </button>
          </div>
        )}
      </section>
      <section className="bottom-grid">
        <div className="invite-panel">
          <span className="eyebrow">
            <Users size={14} /> YOUR ROOM. YOUR RULES.
          </span>
          <h2>
            A little friendly
            <br />
            competition?
          </h2>
          <p>
            No matchmaking queues. No strangers.
            <br />
            Just a code, a friend, and bragging rights.
          </p>
          <Link className="button" to="/play/tictactoe/online">
            Start a private room <ArrowUpRight size={16} />
          </Link>
          <div className="room-code-art">
            <span>ROOM CODE</span>
            <b>LET’S PLAY</b>
            <span>
              <span className="live-dot" /> 2 players · endless rematches
            </span>
          </div>
        </div>
        <div className="leader-preview">
          <div className="section-heading">
            <h3>
              <Trophy size={18} /> Arena legends
            </h3>
            <Link to="/leaderboard">
              View all <ChevronRight size={16} />
            </Link>
          </div>
          <p className="muted">Good games deserve a little recognition.</p>
          {leaders?.length ? (
            leaders.slice(0, 3).map((p, i) => (
              <div className="leader-row" key={p.id}>
                <span className="rank">0{i + 1}</span>
                <span className="avatar">{p.username.slice(0, 2).toUpperCase()}</span>
                <strong>{p.username}</strong>
                <span>
                  {p.wins} <small>wins</small>
                </span>
              </div>
            ))
          ) : (
            <div className="ranking-empty">
              <Trophy size={30} />
              <strong>The top spot is waiting.</strong>
              <span>
                {error
                  ? 'Connect MySQL to unlock persistent rankings.'
                  : 'Play a ranked online match with an account to get on the board.'}
              </span>
              <Link to={error ? '/leaderboard' : '/register'}>
                {error ? 'Ranking status' : 'Make your mark'} <ArrowRight size={13} />
              </Link>
            </div>
          )}
        </div>
      </section>
      <div className="closing-note">
        <Gamepad2 size={19} />
        <span>
          {games.length} games. Two players. <strong>Countless “best of three”s.</strong>
        </span>
      </div>
    </>
  );
}
function LayoutIcon() {
  return (
    <span className="tiny-grid" aria-hidden="true">
      ▦
    </span>
  );
}
