export type TeamWordKey = 'team-a' | 'team-b';

export function toPlayerWordKey(team: TeamWordKey, seatIndex: number): string {
  return `${team}-p${seatIndex + 1}`;
}

export function toLegacyPlayerWordKey(
  teamName: string,
  playerName: string,
): string {
  return `${teamName.trim()}::${playerName.trim()}`;
}
