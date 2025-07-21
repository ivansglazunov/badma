import dotenv from 'dotenv';
dotenv.config();

import { createApolloClient, Generator, Hasyx } from 'hasyx';
import { NextRequest, NextResponse } from 'next/server';
import schema from '@/public/hasura-schema.json';
import Debug from '@/lib/debug';
import { TournamentRoundRobin } from '@/lib/tournament-round-robin';

const debug = Debug('api:tournament-start');

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('id');

    if (!tournamentId) {
      return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 });
    }

    debug(`Processing start tournament request for tournament ${tournamentId}`);

    // Create admin client
    const adminClient = createApolloClient({
      secret: process.env.HASURA_ADMIN_SECRET!,
    });
    const generate = Generator(schema);
    const hasyx = new Hasyx(adminClient, generate);

    // Check if tournament exists and has status 'await'
    const tournament = await hasyx.select({
      table: 'badma_tournaments',
      pk_columns: { id: tournamentId },
      returning: ['id', 'status', 'type', 'user_id']
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    debug(`Found tournament ${tournament.id} with status ${tournament.status} and type ${tournament.type}`);

    // Check if tournament is in the 'await' state
    if (tournament.status !== 'await') {
      return NextResponse.json({ 
        error: 'Tournament cannot be started', 
        message: `Tournament is in '${tournament.status}' status. Only 'await' tournaments can be started.`
      }, { status: 400 });
    }

    // Get participant count
    const participants = await hasyx.select<any[]>({
      table: 'badma_tournament_participants',
      where: { 
        tournament_id: { _eq: tournamentId },
        role: { _eq: 1 } // Only players
      },
      returning: ['id', 'user_id']
    });

    if (participants.length < 2) {
      return NextResponse.json({ 
        error: 'Tournament cannot be started', 
        message: 'Tournament requires at least 2 participants'
      }, { status: 400 });
    }

    // Start the tournament based on its type
    switch (tournament.type) {
      case 'round-robin': {
        const tournamentHandler = new TournamentRoundRobin(hasyx, tournamentId, tournament.user_id);
        await tournamentHandler.start();
        break;
      }
      // Add other tournament types as needed
      default:
        return NextResponse.json({ 
          error: 'Tournament cannot be started', 
          message: `Tournament type '${tournament.type}' is not supported`
        }, { status: 400 });
    }

    // Get updated tournament status
    const updatedTournament = await hasyx.select({
      table: 'badma_tournaments',
      pk_columns: { id: tournamentId },
      returning: ['id', 'status']
    });

    debug(`Tournament ${tournamentId} started successfully. New status: ${updatedTournament.status}`);

    return NextResponse.json({
      success: true,
      message: `Tournament started successfully`,
      tournamentId,
      status: updatedTournament.status
    });

  } catch (error) {
    debug(`Error in tournament-start endpoint: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json(
      { error: 'Failed to start tournament', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
