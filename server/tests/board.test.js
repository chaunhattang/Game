import { describe, it, expect } from 'vitest';
import { createBoard, moveBoard } from '../../shared/board.js';
describe('Tic Tac Toe rules', () => {
  it('detects a winner and highlights the line', () => {
    const s = createBoard('tictactoe');
    [0, 3, 1, 4, 2].forEach((i) => moveBoard(s, s.turn, i));
    expect(s.finished).toBe(true);
    expect(s.winner).toBe(0);
    expect(s.line.sort()).toEqual([0, 1, 2]);
    expect(() => moveBoard(s, 1, 8)).toThrow('finished');
  });
  it('detects a draw', () => {
    const s = createBoard('tictactoe');
    [0, 1, 2, 4, 3, 5, 7, 6, 8].forEach((i) => moveBoard(s, s.turn, i));
    expect(s.finished).toBe(true);
    expect(s.winner).toBe(null);
  });
  it('rejects out-of-turn, occupied and out-of-bounds moves without mutating', () => {
    const s = createBoard('tictactoe');
    expect(() => moveBoard(s, 1, 0)).toThrow('turn');
    moveBoard(s, 0, 0);
    expect(() => moveBoard(s, 1, 0)).toThrow('empty');
    expect(() => moveBoard(s, 1, -1)).toThrow('empty');
    expect(() => moveBoard(s, 1, 9)).toThrow('empty');
    expect(s.moves).toBe(1);
  });
  it.each([[[0, 1, 2]], [[0, 3, 6]], [[0, 4, 8]], [[2, 4, 6]]])(
    'detects every axis: %s',
    (line) => {
      const s = createBoard('tictactoe');
      line.forEach((i) => {
        s.turn = 0;
        moveBoard(s, 0, i);
      });
      expect(s.winner).toBe(0);
    }
  );
});
describe('Gomoku freestyle rules', () => {
  it.each([[1], [15], [16], [14]])('detects five on direction %s', (d) => {
    const s = createBoard('connectfive');
    let start = d === 14 ? 14 : 0;
    for (let i = 0; i < 5; i++) {
      s.turn = 0;
      moveBoard(s, 0, start + i * d);
    }
    expect(s.winner).toBe(0);
  });
  it('allows overlines', () => {
    const s = createBoard('connectfive');
    [0, 1, 2, 4, 5].forEach((i) => {
      s.turn = 0;
      moveBoard(s, 0, i);
    });
    s.turn = 0;
    moveBoard(s, 0, 3);
    expect(s.line.length).toBe(6);
  });
  it('does not wrap rows', () => {
    const s = createBoard('connectfive');
    [13, 14, 15, 16, 17].forEach((i) => {
      s.turn = 0;
      moveBoard(s, 0, i);
    });
    expect(s.finished).toBe(false);
  });
});
