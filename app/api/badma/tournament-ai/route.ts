import dotenv from 'dotenv';
dotenv.config();

import { createApolloClient, Generator, Hasyx } from 'hasyx';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import schema from '@/public/hasura-schema.json';
import Debug from '@/lib/debug';

const debug = Debug('api:tournament-ai');

const TOURNAMENT_AI_PLAYERS_COUNT = 4;

interface User {
  id: string;
  name: string;
  email: string;
}

interface AiConfig {
  id: string;
  user_id: string;
  options: {
    engine?: string;
    level?: number;
  };
}

interface TournamentParticipant {
  id: string;
  user_id: string;
  tournament_id: string;
  role: number;
}

// Helper function to create a fake AI user
async function createAiUser(hasyx: Hasyx, namePrefix: string = 'AI Player', aiLevel: number = 1): Promise<User> {
  const userId = uuidv4();
  const email = `ai-${namePrefix.toLowerCase().replace(/\s+/g, '-')}-${userId.substring(0, 8)}@ai.local`;
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash('ai-password-123', saltRounds);
  const now = Date.now();

  const user = await hasyx.insert<User>({
    table: 'users',
    object: {
      id: userId,
      name: `${namePrefix} ${userId.substring(0, 6)}`,
      email: email,
      password: hashedPassword,
      email_verified: now,
      is_admin: false,
      hasura_role: 'user',
      created_at: now,
      updated_at: now,
    },
    returning: ['id', 'name', 'email']
  });

  // Create AI config for this user
  await hasyx.insert({
    table: 'badma_ais',
    object: {
      user_id: userId,
      options: { engine: 'js-chess-engine', level: aiLevel },
    },
  });

  debug(`Created AI user ${user.name} (ID: ${user.id}) with AI level ${aiLevel}`);
  return user;
}

// Helper to add user to tournament
async function addUserToTournament(hasyx: Hasyx, userId: string, tournamentId: string): Promise<TournamentParticipant> {
  return hasyx.insert<TournamentParticipant>({
    table: 'badma_tournament_participants',
    object: {
      user_id: userId,
      tournament_id: tournamentId,
      role: 1, // Player role
    },
    returning: ['id', 'user_id', 'tournament_id', 'role']
  });
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('id');

    if (!tournamentId) {
      return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 });
    }

    debug(`Processing AI players request for tournament ${tournamentId}`);

    // Create admin client
    const adminClient = createApolloClient({
      secret: process.env.HASURA_ADMIN_SECRET!,
    });
    const generate = Generator(schema);
    const hasyx = new Hasyx(adminClient, generate);

    // Check if tournament exists
    const tournament = await hasyx.select({
      table: 'badma_tournaments',
      pk_columns: { id: tournamentId },
      returning: ['id', 'status', 'type']
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    debug(`Found tournament ${tournament.id} with status ${tournament.status}`);

    // Get existing participants
    const existingParticipants = await hasyx.select<TournamentParticipant[]>({
      table: 'badma_tournament_participants',
      where: { 
        tournament_id: { _eq: tournamentId },
        role: { _eq: 1 } // Only players
      },
      returning: ['id', 'user_id']
    });

    const currentParticipantCount = existingParticipants.length;
    debug(`Current participants in tournament: ${currentParticipantCount}`);

    if (currentParticipantCount >= TOURNAMENT_AI_PLAYERS_COUNT) {
      return NextResponse.json({ 
        message: `Tournament already has ${currentParticipantCount} participants`,
        participantCount: currentParticipantCount
      });
    }

    const neededAiPlayers = TOURNAMENT_AI_PLAYERS_COUNT - currentParticipantCount;
    debug(`Need to add ${neededAiPlayers} AI players`);

    // Get available AI users (users with AI configs)
    const availableAiUsers = await hasyx.select<User[]>({
      table: 'users',
      where: {
        ais: { user_id: { _is_null: false } },
        _not: {
          tournament_participants: {
            tournament_id: { _eq: tournamentId }
          }
        }
      },
      returning: ['id', 'name', 'email'],
      limit: neededAiPlayers
    });

    debug(`Found ${availableAiUsers.length} available AI users`);

    const addedPlayers: User[] = [];

    // Add existing AI users first
    for (const aiUser of availableAiUsers) {
      await addUserToTournament(hasyx, aiUser.id, tournamentId);
      addedPlayers.push(aiUser);
      debug(`Added existing AI user ${aiUser.name} to tournament`);
    }

    // Create new AI users if needed
    const stillNeeded = neededAiPlayers - availableAiUsers.length;
    for (let i = 0; i < stillNeeded; i++) {
      const aiLevel = Math.floor(Math.random() * 3) + 1; // Random level 1-3
      const newAiUser = await createAiUser(hasyx, `AI Bot`, aiLevel);
      await addUserToTournament(hasyx, newAiUser.id, tournamentId);
      addedPlayers.push(newAiUser);
      debug(`Created and added new AI user ${newAiUser.name} to tournament`);
    }

    const finalParticipantCount = currentParticipantCount + addedPlayers.length;

    debug(`Successfully added ${addedPlayers.length} AI players to tournament ${tournamentId}`);

    return NextResponse.json({
      success: true,
      message: `Added ${addedPlayers.length} AI players to tournament`,
      tournamentId,
      addedPlayers: addedPlayers.map(p => ({ id: p.id, name: p.name })),
      totalParticipants: finalParticipantCount
    });

  } catch (error) {
    debug(`Error in tournament-ai endpoint: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json(
      { error: 'Failed to add AI players to tournament', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 