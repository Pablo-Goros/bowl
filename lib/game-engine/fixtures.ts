import type { NewGameInput } from './types';

export const sampleGameInput: NewGameInput = {
  teamAName: 'Team A',
  teamBName: 'Team B',
  teamAPlayers: ['Alex', 'Sam'],
  teamBPlayers: ['Riley', 'Jamie'],
  wordsPerPlayer: 3,
  wordsByPlayer: {
    'team-a-p1': ['Moon', 'Swim', 'Banana'],
    'team-a-p2': ['Pizza', 'Dance', 'Hammer'],
    'team-b-p1': ['Garden', 'Run', 'Lion'],
    'team-b-p2': ['Rocket', 'Sing', 'Doctor'],
  },
};
