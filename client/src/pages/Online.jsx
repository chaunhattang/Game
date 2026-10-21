import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Copy, Check, Users, Wifi, LogOut, ArrowRight, Plus, Keyboard } from 'lucide-react';
import { getGame, games, isBoard } from '../../../shared/catalog';
import { useArena } from '../stores/arena';
import { getSocket, emit, leaveRoom } from '../services/socket';
import { Back, Loading } from '../components/common/UI';
import Board from '../components/games/Board';
import NotFound from './NotFound';
const Arcade = lazy(() => import('../components/games/Arcade'));
export default function Online() {
  const { gameId, roomCode } = useParams(),
    navigate = useNavigate(),
    room = useArena((s) => s.room),
    slot = useArena((s) => s.slot),
    connected = useArena((s) => s.connected),
    [socket, setSocket] = useState(null),
    [code, setCode] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [copy, setCopy] = useState(false),
    [live, setLive] = useState(null);
  const g = getGame(room ? room.gameId : gameId || 'tictactoe');
  useEffect(() => {
    let alive = true;
    getSocket()
      .then(async (s) => {
        if (!alive) return;
        setSocket(s);
        if (roomCode) {
          let r = await emit('room:sync').catch(() =>
            emit('room:join', { code: roomCode.toUpperCase() })
          );
          if (r.room.code !== roomCode.toUpperCase())
            throw new Error(`You are already in room ${r.room.code}. Leave that room first.`);
          const synced = await emit('room:sync');
          if (alive) useArena.setState({ room: synced.room, slot: synced.slot });
        }
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, [roomCode]);
  useEffect(() => setLive(null), [room?.matchId]);
  async function action(fn) {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function enter(create) {
    await action(async () => {
      const r = await emit(
        create ? 'room:create' : 'room:join',
        create ? { gameId: g.id } : { code: code.trim().toUpperCase() }
      );
      const synced = await emit('room:sync');
      useArena.setState({ room: synced.room, slot: synced.slot });
      navigate(`/room/${r.code}`);
    });
  }
  async function copyCode() {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopy(true);
      setTimeout(() => setCopy(false), 2000);
    } catch {
      useArena.getState().toast(`Invitation code: ${room.code}`);
    }
  }
  if (!g) return <NotFound />;
  const paused = room?.players.some((p) => !p.connected) || !connected;
  const state = room?.game;
  const display = live || state;
  return (
    <>
      <Back />
      <div className="game-page-heading">
        <div>
          <span className="eyebrow">PRIVATE MULTIPLAYER</span>
          <h1>{roomCode && room ? g.name : 'Bring your favorite rival.'}</h1>
        </div>
        <span className={`connection-pill ${connected ? 'connected' : ''}`}>
          <Wifi size={14} />
          {connected ? 'Connected' : 'Connecting…'}
        </span>
      </div>
      {error && (
        <div className="inline-error" role="alert">
          {error}
        </div>
      )}
      {!room ? (
        <div className="lobby-grid">
          <section className="panel create-panel">
            <div className="mode-icon purple">
              <Plus />
            </div>
            <h2>Your arena starts here.</h2>
            <p>Choose a game, create a room, then send the invite to your friend.</p>
            <label>
              Choose your battle
              <select value={g.id} onChange={(e) => navigate(`/play/${e.target.value}/online`)}>
                {games.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="button" disabled={busy || !connected} onClick={() => enter(true)}>
              Create private room <ArrowRight size={17} />
            </button>
          </section>
          <form
            className="panel join-panel"
            onSubmit={(e) => {
              e.preventDefault();
              enter(false);
            }}
          >
            <div className="mode-icon cyan">
              <Users />
            </div>
            <h2>Got an invitation?</h2>
            <p>Enter your friend’s six-character room code. No account needed.</p>
            <label>
              Room code
              <input
                className="code-input"
                placeholder="ABC234"
                value={code}
                maxLength={6}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ''))}
                required
                minLength={6}
                autoComplete="off"
              />
            </label>
            <button className="button secondary" disabled={busy || !connected || code.length !== 6}>
              Join the room <ArrowRight size={17} />
            </button>
          </form>
        </div>
      ) : (
        <>
          <div className="room-toolbar">
            <div>
              <span className="muted">INVITATION CODE</span>
              <strong className="room-code">{room.code}</strong>
              <button className="icon-button" aria-label="Copy invitation" onClick={copyCode}>
                {copy ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
            <button
              className="button secondary small"
              disabled={busy}
              onClick={() =>
                action(async () => {
                  await leaveRoom();
                  navigate(`/play/${g.id}/online`);
                })
              }
            >
              <LogOut size={15} /> Leave room
            </button>
          </div>
          <div className="game-layout">
            <section className="game-panel">
              <div className="player-slots">
                {[0, 1].map((i) => {
                  const p = room.players[i];
                  return (
                    <div key={i} className={`player-slot ${slot === i ? 'you' : ''}`}>
                      <span className={`avatar ${i ? 'cyan' : 'purple'}`}>
                        {p ? p.name.slice(0, 2).toUpperCase() : <Users size={20} />}
                      </span>
                      <div>
                        <strong>
                          {p ? p.name : 'Waiting for a friend…'}{' '}
                          {slot === i && <small>(you)</small>}
                        </strong>
                        <span>
                          {p
                            ? `${i === 0 ? 'Host · ' : ''}${p.connected ? (p.ready ? 'Ready ✓' : room.status === 'waiting' ? 'Not ready' : 'In match') : 'Reconnecting…'}`
                            : 'Share your room code'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {room.status === 'waiting' ? (
                <div className="lobby-waiting">
                  <span className="eyebrow">GOOD THINGS COME IN TWOS</span>
                  <h2>
                    {room.players.length === 2
                      ? 'Your rival has arrived.'
                      : 'One friend away from game on.'}
                  </h2>
                  <p>Both players must be ready. The host starts the match.</p>
                  {slot === 0 && (
                    <label>
                      Game
                      <select
                        aria-label="Room game"
                        value={room.gameId}
                        onChange={(e) =>
                          action(() => emit('room:select', { gameId: e.target.value }))
                        }
                      >
                        {games.map((g) => (
                          <option value={g.id} key={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <div className="game-actions">
                    <button
                      className="button secondary"
                      disabled={busy || slot === null || !connected}
                      onClick={() =>
                        action(() => emit('room:ready', { ready: !room.players[slot]?.ready }))
                      }
                    >
                      {room.players[slot]?.ready ? 'Cancel ready' : 'I’m ready'}
                    </button>
                    {slot === 0 && (
                      <button
                        className="button"
                        disabled={
                          busy ||
                          room.players.length !== 2 ||
                          !room.players.every((p) => p.ready && p.connected)
                        }
                        onClick={() => action(() => emit('room:start'))}
                      >
                        Start game <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {paused && room.status === 'playing' && (
                    <div role="status" className="reconnect-banner">
                      Match paused. Waiting for reconnection (30 seconds).
                    </div>
                  )}
                  <div className="match-bar">
                    <span className="p1">Player 1</span>
                    <strong role="status">
                      {state.finished
                        ? state.winner === null
                          ? 'It’s a draw!'
                          : `Player ${state.winner + 1} wins!`
                        : isBoard(g.id)
                          ? state.countdown > 0
                            ? `Starts in ${Math.ceil(state.countdown)}…`
                            : state.turn === slot
                              ? 'Your turn'
                              : `${room.players[state.turn]?.name}’s turn`
                          : `${display?.scores[0] || 0} : ${display?.scores[1] || 0}`}
                    </strong>
                    <span className="p2">Player 2</span>
                  </div>
                  {isBoard(g.id) ? (
                    <Board
                      state={state}
                      disabled={state.turn !== slot || paused || state.countdown > 0}
                      onMove={(index) => action(() => emit('game:move', { index }))}
                    />
                  ) : (
                    socket && (
                      <Suspense fallback={<Loading />}>
                        <Arcade
                          key={room.matchId}
                          gameId={g.id}
                          online
                          socket={socket}
                          slot={slot}
                          initialState={state}
                          paused={paused}
                          onState={setLive}
                        />
                      </Suspense>
                    )
                  )}
                  {state.finished && (
                    <div className="result-panel">
                      <h2>
                        {state.winner === null
                          ? 'Evenly matched.'
                          : state.winner === slot
                            ? 'That round is yours.'
                            : 'A worthy opponent.'}
                      </h2>
                      <p>
                        {room.resultSaved === true
                          ? 'Account results saved.'
                          : room.resultSaved === false
                            ? 'Result saving is pending. The server will retry while running.'
                            : 'Guest matches are temporary.'}
                      </p>
                      <button
                        className="button"
                        disabled={busy || paused || room.rematch.includes(slot)}
                        onClick={() => action(() => emit('game:rematch-vote'))}
                      >
                        {room.rematch.includes(slot)
                          ? 'Waiting for your rival…'
                          : 'Vote for a rematch'}{' '}
                        <ArrowRight size={16} />
                      </button>
                      <span className="muted">{room.rematch.length}/2 votes</span>
                    </div>
                  )}
                </>
              )}
            </section>
            <aside className="panel game-help">
              <span className="eyebrow">THE PLAYBOOK</span>
              <h3>{g.name}</h3>
              <p>{g.instructions}</p>
              <h3>
                <Keyboard size={18} /> Controls
              </h3>
              <p>{g.controls}</p>
              {!isBoard(g.id) && (
                <p className="tip">
                  Online: WASD also controls your own player, whichever slot you occupy. The server
                  validates the action.
                </p>
              )}
              <p className="muted">
                Refresh to reconnect within 30 seconds. Leaving closes the room and forfeits an
                active match.
              </p>
              <Link to="/profile">
                View your arena record <ArrowRight size={14} />
              </Link>
            </aside>
          </div>
        </>
      )}
    </>
  );
}
