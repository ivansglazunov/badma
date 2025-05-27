/**
 * All available tournament types
 * These values are used in the tournaments table 'type' column
 */
export const tournaments: string[] = [
  'round-robin',
  'swiss',
  'knockout',
  'scheveningen'
];

export type TournamentType = typeof tournaments[number];

/**
 * Tournament type descriptions for UI
 */
export const tournamentDescriptions: Record<string, string> = {
  'round-robin': 'Round Robin - Each player plays against every other player',
  'swiss': 'Swiss System - Players paired based on performance',
  'knockout': 'Knockout/Olympic - Single elimination tournament',
  'scheveningen': 'Scheveningen System - Team vs team format'
};

/**
 * Minimum number of players required for each tournament type
 */
export const tournamentMinPlayers: Record<string, number> = {
  'round-robin': 2,
  'swiss': 4,
  'knockout': 4,
  'scheveningen': 4
}; 