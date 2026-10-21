import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/Auth';
import { useData } from '../hooks/useData';
import { api, errorMessage } from '../services/api';
import { getGame } from '../../../shared/catalog';
import { PageTitle, Loading, ErrorPanel, Empty } from '../components/common/UI';
import { useArena } from '../stores/arena';
export default function Profile() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user)
    return (
      <>
        <PageTitle eyebrow="YOUR ARENA RECORD" title="A name behind the wins.">
          Create an account to keep your history, track your stats, and climb the rankings.
        </PageTitle>
        <div className="game-actions">
          <Link to="/login" className="button">
            Log in
          </Link>
          <Link to="/register" className="button secondary">
            Create an account
          </Link>
        </div>
      </>
    );
  return <Account user={user} />;
}
function Account({ user }) {
  const { setUser } = useAuth(),
    stats = useData(`/users/${user.id}/stats`),
    matches = useData('/users/me/matches'),
    [editing, setEditing] = useState(false),
    [name, setName] = useState(user.username),
    [error, setError] = useState('');
  const total = (stats.data || []).reduce(
    (v, s) => ({
      played: v.played + s.matches_played,
      wins: v.wins + s.wins,
      losses: v.losses + s.losses,
      draws: v.draws + s.draws,
    }),
    { played: 0, wins: 0, losses: 0, draws: 0 }
  );
  async function save(e) {
    e.preventDefault();
    try {
      const r = await api.patch('/users/me', { username: name });
      setUser(r.data.data);
      setEditing(false);
      useArena.getState().toast('Profile updated. New rooms use the name after your next login.');
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <>
      <div className="profile-heading">
        <span className="avatar large">{user.username.slice(0, 2).toUpperCase()}</span>
        <div>
          <span className="eyebrow">YOUR CORNER OF THE ARENA</span>
          <h1>{user.username}</h1>
          <p className="muted">Member since {new Date(user.created_at).toLocaleDateString()}</p>
        </div>
        <button className="button secondary small" onClick={() => setEditing(!editing)}>
          Edit profile
        </button>
      </div>
      {editing && (
        <form className="panel edit-form" onSubmit={save}>
          <label>
            Username
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={3}
              maxLength={24}
              pattern="[A-Za-z0-9_]+"
            />
          </label>
          <button className="button small">Save</button>
          {error && <p role="alert">{error}</p>}
        </form>
      )}
      {stats.error ? (
        <ErrorPanel message={stats.error} retry={stats.retry} />
      ) : (
        <div className="stats-grid">
          {[
            ['Matches', total.played],
            ['Wins', total.wins],
            ['Losses', total.losses],
            ['Draws', total.draws],
            ['Win rate', `${total.played ? Math.round((total.wins / total.played) * 100) : 0}%`],
          ].map(([label, value]) => (
            <div className="panel stat" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      )}
      <h2>Recent matches</h2>
      {matches.loading ? (
        <Loading />
      ) : matches.error ? (
        <ErrorPanel message={matches.error} retry={matches.retry} />
      ) : !matches.data?.length ? (
        <Empty title="Your first rivalry is waiting.">
          Play online while signed in to save your match history.
        </Empty>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Game</th>
                <th>Result</th>
                <th>Score</th>
                <th>Finished</th>
              </tr>
            </thead>
            <tbody>
              {matches.data.map((m) => (
                <tr key={m.id}>
                  <td>{getGame(m.game_id)?.name}</td>
                  <td>
                    <span className={`result-badge ${m.result}`}>{m.result}</span>
                  </td>
                  <td>{m.score}</td>
                  <td>{new Date(m.finished_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
