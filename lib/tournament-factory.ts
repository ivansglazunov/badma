import { Hasyx } from 'hasyx';
import { Tournament } from './tournament';
import { TournamentRoundRobin } from './tournament-round-robin';
import { TournamentSwiss } from './tournament-swiss';
import { TournamentKnockout } from './tournament-knockout';
import { TournamentScheveningen } from './tournament-scheveningen';
import Debug from './debug';

const debug = Debug('tournament-factory');

export type TournamentType = 'round-robin' | 'swiss' | 'knockout' | 'scheveningen';

/**
 * Factory function to create tournament instances based on type
 */
export function createTournament(
  hasyx: Hasyx, 
  tournamentId: string, 
  type: TournamentType, 
  organizerId?: string,
  options?: any
): Tournament {
  debug(`Creating tournament instance: type=${type}, tournamentId=${tournamentId}, organizerId=${organizerId}`);
  
  switch (type) {
    case 'round-robin':
      return new TournamentRoundRobin(hasyx, tournamentId, organizerId);
    
    case 'swiss':
      const rounds = options?.rounds || 3; // Default 3 rounds for Swiss
      return new TournamentSwiss(hasyx, tournamentId, organizerId, rounds);
    
    case 'knockout':
      return new TournamentKnockout(hasyx, tournamentId, organizerId);
    
    case 'scheveningen':
      return new TournamentScheveningen(hasyx, tournamentId, organizerId);
    
    default:
      throw new Error(`Unknown tournament type: ${type}`);
  }
}

/**
 * Get tournament class constructor by type (for dynamic imports)
 */
export function getTournamentClass(type: TournamentType) {
  switch (type) {
    case 'round-robin':
      return TournamentRoundRobin;
    case 'swiss':
      return TournamentSwiss;
    case 'knockout':
      return TournamentKnockout;
    case 'scheveningen':
      return TournamentScheveningen;
    default:
      throw new Error(`Unknown tournament type: ${type}`);
  }
} 