import { pool } from '../config/db.js';
// One transaction owns match insertion and all stat updates. UUID is the idempotency key.
export async function saveResult(room, reason = 'completed') {
  const registered = room.players.filter((p) => p.userId);
  if (!registered.length) return;
  const db = await pool.getConnection();
  try {
    await db.beginTransaction();
    const winnerId =
      room.game.winner === null ? null : room.players[room.game.winner]?.userId || null;
    const [insert] = await db.execute(
      'INSERT IGNORE INTO matches (id,game_id,room_code,winner_id,status,started_at,finished_at) VALUES (?,?,?,?,?,?,NOW())',
      [room.matchId, room.gameId, room.code, winnerId, reason, new Date(room.startedAt)]
    );
    if (!insert.affectedRows) {
      await db.rollback();
      return;
    }
    for (let slot = 0; slot < room.players.length; slot++) {
      const p = room.players[slot];
      if (!p.userId) continue;
      const result =
        room.game.winner === null ? 'draw' : room.game.winner === slot ? 'win' : 'loss';
      await db.execute(
        'INSERT INTO match_players (match_id,user_id,player_slot,score,result) VALUES (?,?,?,?,?)',
        [room.matchId, p.userId, slot, room.game.scores[slot] || 0, result]
      );
      await db.execute(
        'INSERT INTO player_stats (user_id,game_id,matches_played,wins,losses,draws,rating) VALUES (?,?,1,?,?,?,?) ON DUPLICATE KEY UPDATE matches_played=matches_played+1,wins=wins+VALUES(wins),losses=losses+VALUES(losses),draws=draws+VALUES(draws),rating=GREATEST(0,rating+VALUES(rating)-1000)',
        [
          p.userId,
          room.gameId,
          result === 'win' ? 1 : 0,
          result === 'loss' ? 1 : 0,
          result === 'draw' ? 1 : 0,
          1000 + (result === 'win' ? 20 : result === 'loss' ? -10 : 0),
        ]
      );
    }
    await db.commit();
  } catch (e) {
    await db.rollback();
    throw e;
  } finally {
    db.release();
  }
}
