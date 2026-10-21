export default function Board({ state, onMove, disabled = false }) {
  const gomoku = state.size === 15;
  return (
    <div
      className={`board ${gomoku ? 'gomoku' : 'tic-board'}`}
      role="group"
      aria-label={gomoku ? 'Connect Five board' : 'Tic Tac Toe board'}
      style={{ gridTemplateColumns: `repeat(${state.size},1fr)` }}
    >
      {state.board.map((value, i) => (
        <button
          key={i}
          aria-label={`Square ${i + 1}${value === null ? ' empty' : ` player ${value + 1}`}`}
          disabled={disabled || state.finished || value !== null}
          onClick={() => onMove(i)}
          className={`cell ${value === 0 ? 'p1' : value === 1 ? 'p2' : ''} ${state.line.includes(i) ? 'winning' : ''} ${state.lastMove === i ? 'last-move' : ''}`}
        >
          {value !== null &&
            (gomoku ? (
              <span className="stone" />
            ) : (
              <>
                <span className="cell-mark-text">{value === 0 ? '×' : '○'}</span>
                <svg
                  className="board-mark"
                  viewBox="0 0 64 64"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="9"
                  strokeLinecap="round"
                >
                  {value === 0 ? (
                    <path d="M16 16l32 32m0-32L16 48" />
                  ) : (
                    <circle cx="32" cy="32" r="22" />
                  )}
                </svg>
              </>
            ))}
        </button>
      ))}
    </div>
  );
}
