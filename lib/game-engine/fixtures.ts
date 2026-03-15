import type { NewGameInput } from './types';

export const sampleGameInput: NewGameInput = {
  teamAName: 'Team A',
  teamBName: 'Team B',
  teamAPlayers: ['Alex', 'Sam'],
  teamBPlayers: ['Riley', 'Jamie'],
  wordsByPlayer: {
    'Team A::Alex': ['Moon', 'Swim', 'Banana'],
    'Team A::Sam': ['Pizza', 'Dance', 'Hammer'],
    'Team B::Riley': ['Garden', 'Run', 'Lion'],
    'Team B::Jamie': ['Rocket', 'Sing', 'Doctor'],
  },
};
