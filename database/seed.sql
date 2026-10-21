-- Catalog only: no fabricated users, match results, or rankings.
INSERT INTO games(id,name,slug,description,category) VALUES
('tictactoe','Tic Tac Toe','tictactoe','Three in a row wins.','Strategy'),
('connectfive','Connect Five','connectfive','Five or more in a row on a 15 by 15 board.','Strategy'),
('pong','Pong Battle','pong','First to seven points.','Arcade'),
('tank','Tank Battle','tank','Three hits win the duel.','Action'),
('bomber','Bomber Arena','bomber','Last player standing wins.','Action'),
('racing','Mini Racing','racing','Three clockwise laps.','Racing'),
('gravity','Gravity Duel','gravity','Flip gravity and outlast your rival in mirrored obstacle courses.','Arcade')
ON DUPLICATE KEY UPDATE name=VALUES(name),description=VALUES(description),category=VALUES(category);
