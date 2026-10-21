export function createBoard(gameId) {
  const size = gameId === 'tictactoe' ? 3 : 15;
  return {
    gameId,
    size,
    board: Array(size * size).fill(null),
    turn: 0,
    winner: null,
    finished: false,
    line: [],
    lastMove: null,
    moves: 0,
    scores: [0, 0],
  };
}
export function moveBoard(state, slot, index) {
  if (state.finished) throw new Error('This match has finished.');
  if (slot !== state.turn) throw new Error('It is not your turn.');
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= state.board.length ||
    state.board[index] !== null
  )
    throw new Error('Choose an empty square.');
  state.board[index] = slot;
  state.lastMove = index;
  state.moves++;
  const n = state.size,
    need = n === 3 ? 3 : 5,
    row = Math.floor(index / n),
    col = index % n;
  for (const [dy, dx] of [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ]) {
    const line = [index];
    for (const sign of [-1, 1]) {
      let y = row + dy * sign,
        x = col + dx * sign;
      while (y >= 0 && x >= 0 && y < n && x < n && state.board[y * n + x] === slot) {
        line.push(y * n + x);
        y += dy * sign;
        x += dx * sign;
      }
    }
    if (line.length >= need) {
      state.finished = true;
      state.winner = slot;
      state.line = line;
      state.scores[slot] = 1;
      break;
    }
  }
  if (!state.finished && state.moves === n * n) state.finished = true;
  if (!state.finished) state.turn = 1 - state.turn;
  return state;
}
