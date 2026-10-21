import { useEffect, Suspense } from 'react';
import { Loading } from '../common/UI';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Gamepad2,
  LayoutGrid,
  Trophy,
  Users,
  ArrowUpRight,
  Volume2,
  VolumeX,
  LogOut,
  UserRound,
  Wifi,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../contexts/Auth';
import { useArena } from '../../stores/arena';
import { api } from '../../services/api';
import { leaveRoom, resetSocket } from '../../services/socket';
import { useState } from 'react';
import { useTheme } from '../../hooks/useTheme';
export default function Layout() {
  const { theme, toggleTheme } = useTheme();
  const { user, setUser } = useAuth(),
    { pathname } = useLocation(),
    notice = useArena((s) => s.notice),
    [muted, setMuted] = useState(true);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => useArena.setState({ notice: null }), 4500);
    return () => clearTimeout(t);
  }, [notice]);
  async function logout() {
    try {
      await leaveRoom();
      await api.post('/auth/logout');
      resetSocket();
      setUser(null);
    } catch (e) {
      useArena.getState().toast(e.message);
    }
  }
  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-icon">
            <Gamepad2 size={27} />
          </span>
          <span>
            2 PLAYER
            <span className="brand-sub">
              ARENA<span className="brand-dot">.</span>
            </span>
          </span>
        </Link>
        <nav className="topnav">
          <NavLink to="/" end>
            Discover
          </NavLink>
          <NavLink to="/leaderboard">Leaderboard</NavLink>
          <NavLink to="/play/tictactoe/online">
            Play with friends <span className="new">LIVE</span>
          </NavLink>
        </nav>
        <div className="account-links">
          <button
            className="icon-button theme-toggle"
            type="button"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          {user ? (
            <>
              <Link to="/profile" className="avatar" title="Your profile">
                {user.username.slice(0, 2).toUpperCase()}
              </Link>
              <button className="icon-button" aria-label="Log out" onClick={logout}>
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="login-link">
                Log in
              </Link>
              <Link to="/register" className="button small">
                Join the arena <ArrowUpRight size={15} />
              </Link>
            </>
          )}
        </div>
      </header>
      <aside className="sidebar">
        <span className="nav-caption">PLAY YOUR WAY</span>
        <NavLink to="/" end>
          <LayoutGrid size={19} />
          Discover
        </NavLink>
        <NavLink to="/play/tictactoe/online">
          <Users size={19} />
          Online rooms <span className="live-dot" />
        </NavLink>
        <NavLink to="/leaderboard">
          <Trophy size={19} />
          Leaderboard
        </NavLink>
        <NavLink to="/profile">
          <UserRound size={19} />
          Your profile
        </NavLink>
        <div className="sidebar-bottom">
          <div className="party-note">
            <Gamepad2 size={24} />
            <strong>A rivalry worth starting.</strong>
            <p>One friend is all you need.</p>
            <Link to="/play/tictactoe/online">
              Create a room <ArrowUpRight size={14} />
            </Link>
          </div>
          <button
            className="sound-toggle"
            onClick={() => {
              setMuted(!muted);
              window.arenaSound = muted;
            }}
          >
            {muted ? <VolumeX size={17} /> : <Volume2 size={17} />} Sound {muted ? 'off' : 'on'}
          </button>
          <span className="sidebar-foot">
            <Wifi size={13} /> Local + online multiplayer
          </span>
        </div>
      </aside>
      <div className="page-shell">
        <main>
          <Suspense fallback={<Loading />}>
            <Outlet />
          </Suspense>
        </main>
        <footer>
          <Link to="/" className="footer-brand">
            <Gamepad2 size={18} /> 2 PLAYER ARENA
          </Link>
          <span>Good games. Great rivalries.</span>
          <span>Made for two. Built for fun.</span>
        </footer>
      </div>
      {notice && (
        <div role="status" className="toast">
          {notice}
          <button
            aria-label="Dismiss notification"
            onClick={() => useArena.setState({ notice: null })}
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
