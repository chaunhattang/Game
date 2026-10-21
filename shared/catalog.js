export const games = [
  {
    id: 'gravity',
    name: 'Gravity Duel',
    tagline: 'Flip gravity. Outlast your rival.',
    category: 'Arcade',
    difficulty: 'Medium',
    description:
      'Two astronauts. Two identical obstacle courses. Switch between the floor and ceiling as the space station gets faster.',
    instructions:
      'Tap your action key to reverse gravity and dodge orange barriers. Both lanes receive the same obstacles. Last astronaut alive wins; simultaneous elimination draws. After 90 seconds, the most passed barriers wins. Release the key before flipping again.',
    controls:
      'P1: Space or W to flip, A / D to move. P2: Enter or Up to flip, Left / Right to move. Touch: tap FLIP; use the arrow buttons to move.',
    accent: '#c084fc',
    icon: 'orbit',
    active: true,
  },
  {
    id: 'tictactoe',
    name: 'Tic Tac Toe',
    tagline: 'Small board. Big mind games.',
    category: 'Strategy',
    difficulty: 'Easy',
    description:
      'The classic rivalry, reimagined. Claim three squares in a row before your opponent.',
    instructions:
      'Take turns placing X and O. Three in a row wins. A full board without a winner is a draw.',
    controls: 'Click or tap an empty square.',
    accent: '#a78bfa',
    icon: 'grid',
    active: true,
  },
  {
    id: 'connectfive',
    name: 'Connect Five',
    tagline: 'Think five moves ahead.',
    category: 'Strategy',
    difficulty: 'Medium',
    description:
      'A 15 × 15 battlefield of quiet calculation. Build a line of five while breaking your rival’s plans.',
    instructions:
      'Take turns placing stones. Five or more consecutive stones horizontally, vertically or diagonally wins. Overlines are allowed.',
    controls: 'Click or tap an empty intersection.',
    accent: '#fbbf24',
    icon: 'stones',
    active: true,
  },
  {
    id: 'pong',
    name: 'Pong Battle',
    tagline: 'A classic. A new challenger.',
    category: 'Arcade',
    difficulty: 'Easy',
    description:
      'Fast rallies, sharp angles, and one more point. The first paddle to reach seven takes the match.',
    instructions:
      'Deflect the ball past your opponent. The ball accelerates after each paddle hit. First to 7 wins.',
    controls: 'P1: W / S. P2: ↑ / ↓. Touch: hold the up / down buttons.',
    accent: '#22d3ee',
    icon: 'pong',
    active: true,
  },
  {
    id: 'tank',
    name: 'Tank Battle',
    tagline: 'Aim true. Own the arena.',
    category: 'Action',
    difficulty: 'Medium',
    description:
      'Outmaneuver your rival in a compact battlefield. Find your angle and make every shot count.',
    instructions:
      'Rotate, drive and shoot around solid cover. Three hits win the duel. Shots stop at walls.',
    controls:
      'P1: W / S drive, A / D rotate, Space fire. P2: ↑ / ↓ drive, ← / → rotate, Enter fire.',
    accent: '#a3e635',
    icon: 'tank',
    active: true,
  },
  {
    id: 'bomber',
    name: 'Bomber Arena',
    tagline: 'Make room for a little chaos.',
    category: 'Action',
    difficulty: 'Medium',
    description:
      'A fresh, original blast arena. Carve a path through crates, trap your rival, and escape your own fuse.',
    instructions:
      'Bombs explode after 2 seconds in a cross, stopping at walls and destroying crates. Escape the blast. Last player standing wins; simultaneous elimination draws.',
    controls:
      'P1: WASD move, Space bomb. P2: arrow keys move, Enter bomb. Hold an action button to repeat.',
    accent: '#fb923c',
    icon: 'bomb',
    active: true,
  },
  {
    id: 'racing',
    name: 'Mini Racing',
    tagline: 'Settle it at the finish line.',
    category: 'Racing',
    difficulty: 'Medium',
    description:
      'Two cars. Three laps. One winner. Nail the corners on a compact overhead circuit.',
    instructions:
      'Drive clockwise around the track. Pass the right, bottom, left and top checkpoints in order. Complete 3 laps to win. Leaving the road slows your car.',
    controls:
      'P1: W / S accelerate / brake, A / D steer. P2: arrow keys. Touch controls available.',
    accent: '#fb7185',
    icon: 'car',
    active: true,
  },
];
export const getGame = (id) => games.find((g) => g.id === id);
export const isBoard = (id) => id === 'tictactoe' || id === 'connectfive';
