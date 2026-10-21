import { lazy, Suspense, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { RotateCcw, Globe, Keyboard } from 'lucide-react';
import { getGame, isBoard } from '../../../shared/catalog';
import { createBoard, moveBoard } from '../../../shared/board';
import { createArcade } from '../../../shared/arcade';
import Board from '../components/games/Board';
import { Back, Loading } from '../components/common/UI';
import NotFound from './NotFound';
const Arcade = lazy(() => import('../components/games/Arcade'));
export default function Local() {
  const { gameId } = useParams();
  const g = getGame(gameId);
  if (!g) return <NotFound />;
  return <LocalMatch key={gameId} g={g} />;
}
function LocalMatch({ g }) {
  const make = () => (isBoard(g.id) ? createBoard(g.id) : createArcade(g.id));
  const [state, setState] = useState(make),
    [round, setRound] = useState(0),
    [score, setScore] = useState([0, 0]),
    [recorded, setRecorded] = useState(false);
  function update(s) {
    setState(s);
    if (s.finished && !recorded) {
      setRecorded(true);
      if (s.winner !== null) setScore((sc) => sc.map((n, i) => (i === s.winner ? n + 1 : n)));
      if (window.arenaSound) {
        const ctx = new AudioContext(),
          o = ctx.createOscillator(),
          gain = ctx.createGain();
        o.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        o.frequency.setValueAtTime(660, ctx.currentTime);
        o.start();
        o.stop(ctx.currentTime + 0.15);
        o.onended = () => ctx.close();
      }
    }
  }
  function move(i) {
    const next = structuredClone(state);
    moveBoard(next, next.turn, i);
    update(next);
  }
  function restart() {
    setState(make());
    setRound((n) => n + 1);
    setRecorded(false);
  }
  return (
    <>
      <Back />
      <div className="game-page-heading">
        <div>
          <span className="eyebrow">LOCAL MULTIPLAYER</span>
          <h1>{g.name}</h1>
        </div>
        <Link className="button secondary small" to={`/play/${g.id}/online`}>
          <Globe size={16} /> Play online
        </Link>
      </div>
      <div className="game-layout">
        <div className="game-panel">
          <div className="match-bar">
            <span className="player-label p1">
              ● Player 1 <strong>{score[0]}</strong>
            </span>
            <span className="match-status" role="status">
              {state.finished
                ? state.winner === null
                  ? 'A well-fought draw'
                  : `Player ${state.winner + 1} wins!`
                : isBoard(g.id)
                  ? `Player ${state.turn + 1}’s turn`
                  : `${state.scores[0]} : ${state.scores[1]}`}
            </span>
            <span className="player-label p2">
              <strong>{score[1]}</strong> Player 2 ●
            </span>
          </div>
          {isBoard(g.id) ? (
            <Board state={state} onMove={move} />
          ) : (
            <Suspense fallback={<Loading />}>
              <Arcade key={round} gameId={g.id} onState={update} />
            </Suspense>
          )}
          <div className="game-actions">
            <button className="button secondary small" onClick={restart}>
              <RotateCcw size={15} />
              {state.finished ? 'Play again' : 'Restart round'}
            </button>
            <span className="muted">Round {round + 1} · Best rivalry wins.</span>
          </div>
        </div>
        <aside className="game-help panel">
          <span className="eyebrow">THE PLAYBOOK</span>
          <h3>How to play</h3>
          <p>{g.instructions}</p>
          <h3>
            <Keyboard size={18} /> Controls
          </h3>
          <p>{g.controls}</p>
          <div className="tip">
            Local results stay on this screen. Play online with an account to build your arena
            record.
          </div>
        </aside>
      </div>
    </>
  );
}
