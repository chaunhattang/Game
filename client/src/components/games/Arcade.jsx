import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { createArcade, stepArcade, TICK } from '../../../../shared/arcade';
import { createArcadeRenderer } from '../../games/renderArcade';
const blank = () => ({ up: false, down: false, left: false, right: false, action: false });
const keyMap = {
  KeyW: [0, 'up'],
  KeyS: [0, 'down'],
  KeyA: [0, 'left'],
  KeyD: [0, 'right'],
  Space: [0, 'action'],
  ArrowUp: [1, 'up'],
  ArrowDown: [1, 'down'],
  ArrowLeft: [1, 'left'],
  ArrowRight: [1, 'right'],
  Enter: [1, 'action'],
};
function interpolate(a, b, t) {
  const s = {
    ...b,
    players: b.players.map((p, i) => {
      const old = a.players[i];
      if (b.gameId === 'bomber') return p;
      return {
        ...p,
        x: old.x + (p.x - old.x) * t,
        y: old.y + (p.y - old.y) * t,
        a:
          p.a === undefined
            ? undefined
            : old.a + Math.atan2(Math.sin(p.a - old.a), Math.cos(p.a - old.a)) * t,
      };
    }),
  };
  if (b.ball)
    s.ball = {
      ...b.ball,
      x: a.ball.x + (b.ball.x - a.ball.x) * t,
      y: a.ball.y + (b.ball.y - a.ball.y) * t,
    };
  if (b.obstacles)
    s.obstacles = b.obstacles.map((o) => {
      const old = a.obstacles?.find((previous) => previous.id === o.id);
      return old ? { ...o, x: old.x + (o.x - old.x) * t } : o;
    });
  return s;
}
export default function Arcade({
  gameId,
  online = false,
  socket = null,
  slot = 0,
  initialState,
  onState,
  paused = false,
}) {
  const container = useRef(null),
    inputs = useRef([blank(), blank()]),
    flipPulse = useRef([0, 0]),
    callback = useRef(onState),
    pause = useRef(paused),
    authoritative = useRef(initialState);
  callback.current = onState;
  pause.current = paused;
  authoritative.current = initialState;
  useEffect(() => {
    // Phaser defers destruction until its next frame. Give each effect its own
    // mount so StrictMode replay / fast rematches cannot leave duplicate canvases.
    const mount = document.createElement('div');
    mount.className = 'phaser-mount';
    Object.assign(mount.style, { position: 'absolute', inset: '0' });
    container.current.appendChild(mount);
    let state = initialState ? structuredClone(initialState) : createArcade(gameId),
      acc = 0,
      lastSend = 0,
      lastUi = '',
      lastInput = -1,
      queue = [],
      lastSequence = -1;
    const packet = ({ state: next, sequence }) => {
      if (sequence <= lastSequence) return;
      lastSequence = sequence;
      queue.push({ at: performance.now(), s: next });
      if (queue.length > 10) queue.shift();
      state = next;
    };
    if (online) socket.on('game:state', packet);
    const updateKey = (e, pressed) => {
      const map = keyMap[e.code];
      if (!map) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      e.preventDefault();
      if (online && map[0] !== (slot || 0) && map[0] !== 0) return;
      const player = online ? slot || 0 : map[0];
      inputs.current[player][map[1]] = pressed;
      if (gameId === 'gravity' && pressed && !e.repeat && (map[1] === 'action' || map[1] === 'up'))
        flipPulse.current[player] = performance.now() + 120;
    };
    const down = (e) => updateKey(e, true),
      up = (e) => updateKey(e, false),
      blur = () => {
        inputs.current = [blank(), blank()];
        flipPulse.current = [0, 0];
      };
    window.addEventListener('keydown', down, { passive: false });
    window.addEventListener('keyup', up, { passive: false });
    window.addEventListener('blur', blur);
    document.addEventListener('visibilitychange', blur);
    class ArenaScene extends Phaser.Scene {
      create() {
        this.renderer = createArcadeRenderer(this, state);
        this.add.text(
          18,
          9,
          gameId === 'gravity'
            ? 'GRAVITY DUEL  /  ORBITAL STATION'
            : 'POCKET ARCADE  /  ' + gameId.toUpperCase(),
          {
            fontFamily: 'Segoe UI, sans-serif',
            fontSize: '10px',
            color: gameId === 'tank' || gameId === 'racing' ? '#243545' : '#c9cde8',
            fontStyle: 'bold',
          }
        );
        this.clock = this.add
          .text(782, 9, '', {
            fontFamily: 'monospace',
            fontSize: '10px',
            color: gameId === 'tank' || gameId === 'racing' ? '#243545' : '#c9cde8',
          })
          .setOrigin(1, 0);
        this.label = this.add
          .text(400, 230, '', {
            fontFamily: 'Segoe UI, sans-serif',
            fontSize: '38px',
            fontStyle: 'bold',
            color: '#ffffff',
            align: 'center',
            backgroundColor: '#17172fe8',
            stroke: '#17172f',
            strokeThickness: 2,
            padding: { x: 24, y: 16 },
          })
          .setOrigin(0.5);
      }
      update(now, delta) {
        // Preserve short taps long enough for a simulation step / network packet.
        const effectiveInputs = inputs.current.map((keys, i) =>
          gameId === 'gravity' && performance.now() < flipPulse.current[i]
            ? { ...keys, action: true }
            : keys
        );
        if (online && authoritative.current?.finished) state = authoritative.current;
        if (!online && !pause.current) {
          acc += Math.min(delta / 1000, 0.1);
          while (acc >= TICK) {
            stepArcade(state, effectiveInputs);
            acc -= TICK;
          }
        }
        if (online && !state.finished && socket.connected && !pause.current) {
          const keys = effectiveInputs[slot || 0];
          const mask =
            (keys.up ? 1 : 0) |
            (keys.down ? 2 : 0) |
            (keys.left ? 4 : 0) |
            (keys.right ? 8 : 0) |
            (keys.action ? 16 : 0);
          if ((mask !== lastInput && now - lastSend >= 50) || now - lastSend >= 100) {
            // A heartbeat stays safely inside the server's 300ms input expiry.
            // Volatile inputs are dropped instead of replayed after congestion.
            socket.volatile.emit('game:input', keys);
            lastInput = mask;
            lastSend = now;
          }
        }
        let rendered = state;
        if (online && !state.finished && queue.length > 1) {
          const target = performance.now() - 100;
          while (queue.length > 2 && queue[1].at <= target) queue.shift();
          const [a, b] = queue;
          rendered = interpolate(
            a.s,
            b.s,
            Math.max(0, Math.min(1, (target - a.at) / (b.at - a.at || 1)))
          );
        }
        if (!this.finishedFrame) {
          this.renderer.render(rendered);
          this.finishedFrame = state.finished;
        }
        const label = pause.current
          ? 'RECONNECTING…'
          : state.countdown > 0
            ? `${Math.ceil(state.countdown)}`
            : state.finished
              ? state.winner === null
                ? 'DRAW'
                : `PLAYER ${state.winner + 1} WINS`
              : '';
        this.label.setText(label).setVisible(!!label);
        this.clock.setText(
          gameId === 'gravity'
            ? `${Math.ceil(Math.max(0, 90 - Math.max(0, state.time - 3)))}s`
            : `${Math.floor(Math.max(0, state.time - 3))}s`
        );
        const uiKey = `${state.scores[0]}:${state.scores[1]}:${state.finished}:${state.winner}`;
        if (uiKey !== lastUi) {
          callback.current?.({
            scores: [...state.scores],
            finished: state.finished,
            winner: state.winner,
          });
          lastUi = uiKey;
        }
      }
    }
    const game = new Phaser.Game({
      type: Phaser.CANVAS,
      parent: mount,
      width: 800,
      height: 500,
      backgroundColor: '#0c1425',
      scene: ArenaScene,
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      audio: { noAudio: true },
      banner: false,
    });
    return () => {
      game.destroy(true);
      mount.remove();
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
      document.removeEventListener('visibilitychange', blur);
      if (online) socket.off('game:state', packet);
      inputs.current = [blank(), blank()];
      flipPulse.current = [0, 0];
    };
    // Remounting with matchId is intentional: each match owns exactly one Phaser instance.
  }, [gameId, online, socket, slot]);
  return (
    <>
      <div className="arcade-container" ref={container} aria-label={`${gameId} game canvas`} />
      <div className="touch-controls">
        {(online ? [slot || 0] : [0, 1]).map((i) => (
          <div key={i} className={`touch-player p${i + 1}`}>
            <span>P{i + 1}</span>
            {(gameId === 'gravity'
              ? [
                  ['left', '\u2190'],
                  ['action', 'FLIP'],
                  ['right', '\u2192'],
                ]
              : [
                  ['left', '←'],
                  ['up', '↑'],
                  ['down', '↓'],
                  ['right', '→'],
                  ['action', '●'],
                ]
            ).map(([k, label]) => (
              <button
                key={k}
                className={gameId === 'gravity' && k === 'action' ? 'flip-control' : undefined}
                aria-label={`Player ${i + 1} ${k}`}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  inputs.current[i][k] = true;
                  if (gameId === 'gravity' && k === 'action')
                    flipPulse.current[i] = performance.now() + 120;
                }}
                onPointerUp={() => {
                  inputs.current[i][k] = false;
                }}
                onPointerCancel={() => {
                  inputs.current[i][k] = false;
                }}
                onLostPointerCapture={() => {
                  inputs.current[i][k] = false;
                }}
              >
                {label}
              </button>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
