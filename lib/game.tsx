'use client'

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useClient, useSubscription } from 'hasyx';
import { LoaderCircle } from 'lucide-react';
import { AxiosChessClient } from './axios-chess-client';
import { ChessClientMove } from './chess-client';
import { Chess } from './chess';
import { useTheme } from 'hasyx/components/theme-switcher';
import Board from './board';
import axios from 'axios';
import Debug from './debug';

const debug = Debug('game');

interface GameJoin {
  id: string;
  user_id: string;
  side: number;
  role: number;
  client_id?: string;
}

interface GameData {
  id: string;
  fen: string;
  status: string;
  joins: GameJoin[];
}

interface GameProps {
  gameId: string;
  onClose?: () => void;
}

interface GameCoreProps {
  gameData: GameData;
  currentUserId?: string | null;
}

export function GameCore({ gameData, currentUserId }: GameCoreProps) {
  const { theme } = useTheme();
  
  // Determine current user's participation
  const userJoins = useMemo(() => {
    if (!currentUserId) {
      debug('No currentUserId provided, showing as spectator');
      return [];
    }
    
    debug('Looking for user joins with currentUserId:', currentUserId);
    debug('Available joins:', gameData.joins.map(j => ({ user_id: j.user_id, side: j.side, role: j.role })));
    
    const joins = gameData.joins.filter(join => 
      join.user_id === currentUserId && join.role === 1 // only players
    );
    
    debug('Found user joins:', joins.length);
    return joins;
  }, [gameData.joins, currentUserId]);

  // Create axios instance
  const axiosInstance = useMemo(() => {
    return axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }, []);

  // Create chess clients for each side the user participates in
  const chessClients = useMemo(() => {
    if (userJoins.length === 0 || !currentUserId) {
      debug('No chess clients created - spectator mode');
      return {};
    }
    
    const clients: Record<number, AxiosChessClient> = {};
    
    userJoins.forEach(join => {
      const client = new AxiosChessClient(axiosInstance);
      client.clientId = join.client_id || join.id;
      client.userId = currentUserId;
      client.gameId = gameData.id;
      client.joinId = join.id;
      client.side = join.side as any;
      client.role = join.role as any;
      client.fen = gameData.fen;
      client.status = gameData.status as any;
      
      clients[join.side] = client;
      debug('Created chess client for side:', join.side);
    });
    
    debug('Created chess clients for sides:', Object.keys(clients));
    return clients;
  }, [userJoins, currentUserId, gameData, axiosInstance]);

  const handleMove = (move: ChessClientMove) => {
    debug('handleMove attempted:', move);
    
    try {
      // Determine whose turn it is
      const chess = new Chess(gameData.fen);
      const currentTurn = chess.turn; // 1 for white, 2 for black
      
      const activeClient = chessClients[currentTurn];
      if (!activeClient) {
        debug('No active client for current turn', currentTurn, 'available clients:', Object.keys(chessClients));
        return false;
      }

      // Make move through the client
      const result = activeClient.syncMove(move);
      if (result.error) {
        debug('Move error:', result.error);
        return false;
      }

      debug('Move successful:', result);
      return true;
    } catch (error) {
      debug('Error in handleMove:', error);
      return false;
    }
  };

  // Determine board orientation
  const boardOrientation = useMemo(() => {
    if (userJoins.length === 0) return 'white'; // spectator
    if (userJoins.length === 1) {
      return userJoins[0].side === 1 ? 'white' : 'black';
    }
    return 'white'; // if playing both sides, show white at bottom
  }, [userJoins]);

  debug('Rendering game:', {
    gameId: gameData.id,
    fen: gameData.fen,
    status: gameData.status,
    userJoins: userJoins.length,
    orientation: boardOrientation,
    hasClients: Object.keys(chessClients).length > 0,
    isSpectator: userJoins.length === 0
  });

  return (
    <div className="flex flex-col items-center space-y-4 w-full h-full min-h-screen">
      {userJoins.length === 0 && (
        <div className="text-sm text-muted-foreground bg-muted/30 px-3 py-1 rounded">
          Spectator Mode
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs mt-1 opacity-60">
              Debug: currentUserId="{currentUserId}", joins={gameData.joins.length}
            </div>
          )}
        </div>
      )}
      <div className="flex-1 w-full flex items-center justify-center p-4">
        <div className="w-full h-full max-w-[min(80vw,80vh)] max-h-[min(80vw,80vh)] aspect-square">
          <Board 
            position={gameData.fen}
            onMove={userJoins.length > 0 ? handleMove : undefined}
            orientation={boardOrientation}
            bgBlack={theme === "dark" ? '#3b0764' : '#c084fc'}
            bgWhite={theme === "dark" ? '#581c87' : '#faf5ff'}
          />
        </div>
      </div>
    </div>
  );
}

export default function Game({ gameId, onClose }: GameProps) {
  const { data: session } = useSession();
  const currentUserEmail = session?.user?.email;

  console.log('Game component debug:', {
    gameId,
    currentUserEmail,
    sessionUser: session?.user
  });

  const { data, loading, error } = useSubscription(
    {
      table: 'badma_games',
      where: { id: { _eq: gameId } },
      returning: [
        'id',
        'fen', 
        'status',
        {
          joins: [
            'id',
            'user_id', 
            'side',
            'role',
            'client_id'
          ]
        }
      ]
    },
    { skip: !gameId }
  );

  const gameData = useMemo(() => {
    const result = Array.isArray(data) ? data[0] : (data && (data as any).badma_games) ? (data as any).badma_games[0] : null;
    if (result) {
      console.log('Game data loaded:', {
        gameId: result.id,
        joinsCount: result.joins?.length || 0,
        joins: result.joins?.map((j: any) => ({ user_id: j.user_id, side: j.side, role: j.role }))
      });
    }
    return result;
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoaderCircle className="animate-spin h-8 w-8 text-purple-500" />
        <span className="ml-2">Loading game...</span>
      </div>
    );
  }

  if (error || !gameData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">Error loading game: {error?.message || 'Game not found'}</p>
      </div>
    );
  }

  return (
    <GameCore 
      gameData={gameData}
      currentUserId={currentUserEmail}
    />
  );
} 