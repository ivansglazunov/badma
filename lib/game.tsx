'use client'

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useClient, useSubscription } from 'hasyx';
import { LoaderCircle } from 'lucide-react';
import { Badge } from 'hasyx/components/ui/badge';
import { Button } from 'hasyx/components/ui/button';
import { toast } from 'sonner';
import { AxiosChessClient } from './axios-chess-client';
import { ChessClientMove } from './chess-client';
import { Chess } from './chess';
import { useTheme } from 'hasyx/components/theme-switcher';
import Board from './board';
import axios from 'axios';
import Debug from './debug';
import React from 'react';
import { HoverCard } from 'badma/components/hover-card';

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
  gameInvite?: {
    gameId: string;
    side: number;
    role: number;
  } | null;
  onJoinInvite?: () => void;
  isJoining?: boolean;
}

interface GameCoreProps {
  gameData: GameData;
  currentUserId?: string | null;
  gameInvite?: {
    gameId: string;
    side: number;
    role: number;
  } | null;
  onJoinInvite?: () => void;
  isJoining?: boolean;
}

export function GameCore({ gameData, currentUserId, gameInvite, onJoinInvite, isJoining }: GameCoreProps) {
  console.log('⚙️ [GAMECORE] GameCore rendered with:', { 
    gameId: gameData.id, 
    currentUserId, 
    hasGameInvite: !!gameInvite, 
    gameInvite, 
    hasOnJoinInvite: !!onJoinInvite, 
    isJoining 
  });
  
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

  // Determine if waiting for opponent
  const isWaitingForOpponent = useMemo(() => {
    if (userJoins.length === 0) return false; // spectator
    
    // Check if game status is 'await' or if there's only one player joined
    const playerJoins = gameData.joins.filter(join => join.role === 1); // only players
    return gameData.status === 'await' || playerJoins.length === 1;
  }, [userJoins.length, gameData.status, gameData.joins]);

  debug('Rendering game:', {
    gameId: gameData.id,
    fen: gameData.fen,
    status: gameData.status,
    userJoins: userJoins.length,
    orientation: boardOrientation,
    hasClients: Object.keys(chessClients).length > 0,
    isSpectator: userJoins.length === 0,
    isWaitingForOpponent
  });
  const [useOrientation, setUseOrientation] = useState(true);
  const [orientationSensitivity, setOrientationSensitivity] = useState(0.8);
  const [orientationData, setOrientationData] = useState<{
    alpha: number | null;
    beta: number | null;
    gamma: number | null;
    timestamp: number;
    isSupported: boolean;
    isActive: boolean;
  } | null>(null);

  return (
    <div className="flex flex-col items-center w-full h-full min-h-screen relative">
      {/* Game Invite HoverCard */}
      {gameInvite && (() => {
        console.log('🎨 [HOVERCARD] Rendering HoverCard for invite:', gameInvite);
        return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <HoverCard
            force={1.3}
            maxRotation={25}
            maxLift={50}
            useDeviceOrientation={true}
            orientationSensitivity={0.8}
          >
            <div className="w-[400px] h-[400px] bg-purple-600 rounded-lg shadow-xl flex items-center justify-center pointer-events-none">
              <div className="text-white text-center pointer-events-auto p-8">
                <div className="space-y-4">
                  <h1 className="text-4xl mb-4">♟️</h1>
                  <h2 className="text-2xl font-bold mb-2">Приглашение в игру</h2>
                  <p className="text-sm opacity-80 mb-6">
                    Вас приглашают сыграть партию в шахматы
                  </p>
                  
                  <div className="space-y-3">
                    <Button 
                      className="w-full h-12 bg-white text-purple-600 hover:bg-gray-100 font-semibold"
                      disabled={isJoining}
                      onClick={onJoinInvite}
                    >
                      {isJoining ? (
                        <>
                          <LoaderCircle className="animate-spin h-4 w-4 mr-2" />
                          Присоединение...
                        </>
                      ) : (
                        `Вступить в игру за ${gameInvite.side === 1 ? 'белых' : 'черных'}`
                      )}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full h-10 border-white/30 text-white hover:bg-white/10"
                      onClick={() => window.history.back()}
                      disabled={isJoining}
                    >
                      Отменить
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </HoverCard>
        </div>
        );
      })()}
      <div className="py-16 flex flex-col items-center space-y-4">
        {userJoins.length === 0 && (
          <Badge variant="outline" className="px-4 py-2 text-sm border-2">
            Режим наблюдателя
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs mt-1 opacity-60">
                Debug: currentUserId="{currentUserId}", joins={gameData.joins.length}
              </div>
            )}
          </Badge>
        )}
        {isWaitingForOpponent && (
          <div className="flex items-center gap-3">
            <Badge className="bg-purple-900/90 text-white px-4 py-2 text-sm backdrop-blur-md shadow-lg">
              Ожидание противника
            </Badge>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                // Определяем сторону для приглашения (противоположная сторона)
                const userSide = userJoins[0]?.side;
                const inviteSide = userSide === 1 ? 2 : 1;
                
                // Создаем ссылку для приглашения
                const inviteUrl = `${window.location.origin}?gameId=${gameData.id}&side=${inviteSide}&role=1`;
                
                // Копируем в буфер обмена
                navigator.clipboard.writeText(inviteUrl).then(() => {
                  toast.success('Ссылка скопирована в буфер обмена!');
                }).catch(() => {
                  toast.error('Ошибка копирования ссылки');
                });
              }}
              className="text-xs"
            >
              Пригласить
            </Button>
          </div>
        )}
      </div>
      <div className="flex-1 w-full flex items-center justify-center p-4">
        <div className="w-full h-full max-w-[min(80vw,80vh)] max-h-[min(80vw,80vh)] aspect-square">
          <HoverCard
            force={1.3}
            maxRotation={10}
            maxLift={50}
            useDeviceOrientation={useOrientation}
            orientationSensitivity={orientationSensitivity}
            onOrientationData={setOrientationData}
          >
            <Board 
              position={gameData.fen}
              onMove={userJoins.length > 0 ? handleMove : undefined}
              orientation={boardOrientation}
              bgBlack={theme === "dark" ? '#3b0764' : '#c084fc'}
              bgWhite={theme === "dark" ? '#581c87' : '#faf5ff'}
            />
          </HoverCard>
        </div>
      </div>
    </div>
  );
}

export default function Game({ gameId, onClose, gameInvite, onJoinInvite, isJoining }: GameProps) {
  console.log('🎮 [GAME] Game component rendered with props:', { 
    gameId, 
    hasGameInvite: !!gameInvite, 
    gameInvite, 
    hasOnJoinInvite: !!onJoinInvite, 
    isJoining 
  });
  
  const { data: session } = useSession();

  const currentUserId = session?.user?.id;

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
      currentUserId={currentUserId}
      gameInvite={gameInvite}
      onJoinInvite={onJoinInvite}
      isJoining={isJoining}
    />
  );
} 