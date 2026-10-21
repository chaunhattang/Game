import { useState } from 'react';
import { Trophy } from 'lucide-react';
import { games } from '../../../shared/catalog';
import { useData } from '../hooks/useData';
import { PageTitle, ErrorPanel, Empty, Loading } from '../components/common/UI';
export default function Leaderboard() {
  const [game, setGame] = useState(''),
    { data, error, loading, retry } = useData(`/leaderboard${game ? `/${game}` : ''}`);
  return (
    <>
      <PageTitle eyebrow="A LITTLE FRIENDLY COMPETITION" title="The arena’s finest.">
        Every victory counts. Rankings reflect completed online matches by registered players.
      </PageTitle>
      <div className="tabs ranking-tabs">
        <button className={!game ? 'active' : ''} onClick={() => setGame('')}>
          All games
        </button>
        {games.map((g) => (
          <button
            key={g.id}
            className={game === g.id ? 'active' : ''}
            onClick={() => setGame(g.id)}
          >
            {g.name}
          </button>
        ))}
      </div>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorPanel message={error} retry={retry} />
      ) : !data?.length ? (
        <Empty title="Be the first arena legend.">
          No ranked matches yet. Create an account and challenge a friend online.
        </Empty>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Wins</th>
                <th>Matches</th>
                <th>Win rate</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p, i) => (
                <tr key={p.id}>
                  <td>
                    {i === 0 ? (
                      <Trophy size={19} className="gold" />
                    ) : (
                      String(i + 1).padStart(2, '0')
                    )}
                  </td>
                  <td>
                    <span className="table-player">
                      <span className="avatar">{p.username.slice(0, 2).toUpperCase()}</span>
                      <strong>{p.username}</strong>
                    </span>
                  </td>
                  <td>{p.wins}</td>
                  <td>{p.total_games}</td>
                  <td>{p.win_rate}%</td>
                  <td>{p.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
