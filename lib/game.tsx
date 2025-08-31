'use client'

import { useState, useEffect, useMemo } from 'react';
import { motion, useMotionValue, useAnimation } from 'motion/react';
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
import { PERK_TYPES } from './items';
import axios from 'axios';
import Debug from './debug';
import React from 'react';
import { HoverCard } from 'badma/components/hover-card';
import { useToastHandleGameError } from '@/hooks/toasts';
import { useMultipleUserSettings } from '../hooks/user-settings';
import { getPiecesStyle } from './items';
import { MinefieldPerk } from './items/minefield-perk';
import { useHasyx } from 'hasyx';
import Boracay from 'react-explode/Boracay';

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
  gameInvite?: {
    gameId: string;
    side: number;
    role: number;
  } | null;
  onJoinInvite?: () => void;
  isJoining?: boolean;
}

export function GameCore({ gameData, gameInvite, onJoinInvite, isJoining }: GameCoreProps) {
  const hasyx = useHasyx();
  const currentUserId = hasyx.userId;
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
      join.user_id === hasyx.userId && join.role === 1 // only players
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

      // Register minefield perk
      const minefieldPerk = new MinefieldPerk('client');
      client.perks.registerPerk(minefieldPerk);
      debug('Registered MinefieldPerk for client side:', join.side);

      clients[join.side] = client;
      debug('Created chess client for side:', join.side);
    });

    debug('Created chess clients for sides:', Object.keys(clients));
    return clients;
  }, [userJoins, currentUserId, gameData, axiosInstance]);

  // Get all unique user IDs from game joins
  const allUserIds = useMemo(() => {
    const userIds = gameData.joins
      .filter(join => join.role === 1) // only players
      .map(join => join.user_id)
      .filter((userId, index, array) => array.indexOf(userId) === index); // unique
    debug('All player user IDs:', userIds);
    return userIds;
  }, [gameData.joins]);

  // Get players with their colors from game joins
  const players = useMemo(() => {
    return gameData.joins
      .filter(join => join.role === 1) // only players
      .map(join => ({
        id: join.user_id,
        color: join.side === 1 ? 'white' : 'black'
      }));
  }, [gameData.joins]);

  // Get settings for all players
  debug('🔍 [GAME] About to call useMultipleUserSettings with allUserIds:', allUserIds);
  const { settingsMap, loading: settingsLoading, error: settingsError } = useMultipleUserSettings(allUserIds);
  debug('🔍 [GAME] useMultipleUserSettings result:', { settingsMap, settingsLoading, settingsError });

  // Determine pieces styles for white and black pieces separately
  const { whitePiecesStyle, blackPiecesStyle } = useMemo(() => {
    debug('🎨 [PIECES_STYLE] Determining pieces styles for both players:', {
      currentUserId,
      settingsLoading,
      hasSettingsMap: !!settingsMap,
      settingsMapKeys: Object.keys(settingsMap || {}),
      players: players?.map(p => ({ id: p.id, color: p.color }))
    });

    const defaultStyle = getPiecesStyle('classic_pieces');

    // Find white and black players
    const whitePlayer = players.find(p => p.color === 'white');
    const blackPlayer = players.find(p => p.color === 'black');

    // Get white player's style
    const whitePlayerSettings = whitePlayer ? settingsMap[whitePlayer.id] : null;
    const whiteStyleId = whitePlayerSettings?.pieces ? whitePlayerSettings.pieces : 'classic_pieces';
    const whiteStyle = getPiecesStyle(whiteStyleId);

    // Get black player's style
    const blackPlayerSettings = blackPlayer ? settingsMap[blackPlayer.id] : null;
    const blackStyleId = blackPlayerSettings?.pieces ? blackPlayerSettings.pieces : 'classic_pieces';
    const blackStyle = getPiecesStyle(blackStyleId);

    debug('🎨 [PIECES_STYLE] Player styles determined:', {
      whitePlayer: whitePlayer?.id,
      whitePlayerSettings,
      whiteStyleId,
      whiteStyleName: whiteStyle?.name,
      blackPlayer: blackPlayer?.id,
      blackPlayerSettings,
      blackStyleId,
      blackStyleName: blackStyle?.name
    });

    console.log('🎨 [PIECES_STYLE] DETAILED DEBUG:', {
      allPlayers: players,
      whitePlayer,
      blackPlayer,
      settingsMap,
      whitePlayerSettings,
      blackPlayerSettings,
      whiteStyleId,
      blackStyleId,
      whiteStyleResult: whiteStyle,
      blackStyleResult: blackStyle
    });

    return {
      whitePiecesStyle: whiteStyle || defaultStyle,
      blackPiecesStyle: blackStyle || defaultStyle
    };
  }, [players, settingsMap, settingsLoading]);

  const handleMove = (move: ChessClientMove) => {
    console.log('🎯 [MOVE] Move attempted:', move);
    debug('handleMove attempted:', move);

    try {
      // Determine whose turn it is
      const chess = new Chess();
      chess.fen = gameData.fen; // Load the current position
      const currentTurn = chess.turn; // 1 for white, 2 for black

      console.log('🎯 [MOVE] Position loaded:', {
        originalFen: gameData.fen,
        loadedFen: chess.fen,
        fenMatches: gameData.fen === chess.fen
      });

      console.log('🎯 [MOVE] Turn analysis:', {
        currentTurn,
        availableClients: Object.keys(chessClients),
        hasActiveClient: !!chessClients[currentTurn],
        gameStatus: gameData.status,
        isWaitingForOpponent
      });

      const activeClient = chessClients[currentTurn];
      if (!activeClient) {
        console.log('❌ [MOVE] No active client for current turn', currentTurn, 'available clients:', Object.keys(chessClients));
        debug('No active client for current turn', currentTurn, 'available clients:', Object.keys(chessClients));
        return false;
      }

      console.log('🎯 [MOVE] Making move through client:', {
        clientId: activeClient.clientId,
        userId: activeClient.userId,
        side: activeClient.side,
        gameId: activeClient.gameId
      });

      // Make move through the client
      const result = activeClient.syncMove(move);
      if (result.error) {
        console.log('❌ [MOVE] Move error:', result.error);
        debug('Move error:', result.error);
        return false;
      }

      console.log('✅ [MOVE] Move successful:', result);
      debug('Move successful:', result);
      return true;
    } catch (error) {
      console.log('❌ [MOVE] Error in handleMove:', error);
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
    if (userJoins.length === 0) {
      console.log('🔍 [WAITING] Spectator mode - not waiting');
      return false; // spectator
    }

    // Check if game status is 'await' or if there's only one player joined
    const playerJoins = gameData.joins.filter(join => join.role === 1); // only players
    const isWaiting = gameData.status === 'await' || playerJoins.length === 1;

    console.log('🔍 [WAITING] Analysis:', {
      gameStatus: gameData.status,
      playerJoinsCount: playerJoins.length,
      userJoinsCount: userJoins.length,
      isWaiting,
      allJoins: gameData.joins.map(j => ({ user_id: j.user_id, side: j.side, role: j.role }))
    });

    return isWaiting;
  }, [userJoins.length, gameData.status, gameData.joins]);

  // Determine current turn for active games
  const currentTurn = useMemo(() => {
    if (gameData.status !== 'react' && gameData.status !== 'continue') {
      return null;
    }

    try {
      const chess = new Chess();
      chess.fen = gameData.fen;
      return chess.turn; // 1 for white, 2 for black
    } catch (error) {
      console.log('❌ [TURN] Error determining turn:', error);
      return null;
    }
  }, [gameData.fen, gameData.status]);

  // Get active client for current turn
  const activeClient = useMemo(() => {
    if (userJoins.length === 0) return null;

    const chess = new Chess();
    chess.fen = gameData.fen;
    const currentTurn = chess.turn;

    debug('Determining active client:', {
      currentTurn,
      availableClients: Object.keys(chessClients),
      gameDataFen: gameData.fen
    });

    const activeClient = chessClients[currentTurn];
    if (!activeClient) {
      debug(`No active client for current turn ${currentTurn}`);
      return null;
    }

    debug(`Active client found for turn ${currentTurn}:`, activeClient.clientId);
    return activeClient;
  }, [chessClients, gameData.fen, userJoins.length]);

  // Universal function for applying perks
  const handleApplyPerk = async (perkId: string) => {
    if (!activeClient) {
      toast.error('Нет активного клиента для применения перка');
      return;
    }

    try {
      debug(`🎯 [APPLY_PERK] Applying perk: ${perkId}`);
      await activeClient.asyncPerk(perkId, {});
      
      // Find perk name for toast
      const perk = PERK_TYPES.find(p => p.id === perkId);
      const perkName = perk ? perk.name : perkId;
      
      toast.success(`${perkName} применен!`);
      debug(`🎯 [APPLY_PERK] Perk ${perkId} applied successfully`);
    } catch (error) {
      debug(`🎯 [APPLY_PERK] Error applying perk ${perkId}:`, error);
      toast.error('Ошибка при применении перка');
    }
  };

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

  // Perk positions state - каждый перк помнит свою исходную позицию
  const [perkPositions, setPerkPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [activePerk, setActivePerk] = useState<string | null>(null); // ID активного перка
  const [availablePerks, setAvailablePerks] = useState(PERK_TYPES); // Доступные перки (убираются после применения)
  const [explosionPerkId, setExplosionPerkId] = useState<string | null>(null); // Перк для Boracay вспышки
  const [animatingPerkId, setAnimatingPerkId] = useState<string | null>(null); // Перк в стадии финальной анимации

  // Создаем motion values для каждого типа перка как отдельные хуки
  const minefieldX = useMotionValue(0);
  const minefieldY = useMotionValue(0);
  const minefieldControls = useAnimation();
  
  // Можно добавить другие перки по мере необходимости
  
  // Маппинг перков на их motion данные
  const perkMotionData = useMemo(() => ({
    'minefield_perk': {
      x: minefieldX,
      y: minefieldY,
      controls: minefieldControls
    }
    // Можно добавить другие перки здесь
  }), [minefieldX, minefieldY, minefieldControls]);

  // Функция применения активного перка
  const handleApplyActivePerk = async () => {
    if (!activePerk || !activeClient) {
      console.warn('Нет активного перка или клиента');
      return;
    }

    const perkType = availablePerks.find(p => p.id === activePerk);
    if (!perkType || !perkType.perkClass) {
      console.warn('Перк не найден или не имеет perkClass');
      return;
    }

    try {
      const perkInstance = new perkType.perkClass('client');

      // Стартуем анимацию взлета немедленно, параллельно с серверным вызовом
      const motionData = perkMotionData[activePerk];
      const screenHeight = window.innerHeight;
      let upAnimPromise: Promise<any> | null = null;
      if (motionData) {
        const { controls } = motionData;
        setAnimatingPerkId(activePerk);
        const screenWidth = window.innerWidth;
        const overshoot = Math.max(screenHeight, screenWidth) + 300; // гарантированно выше экрана с учетом scale
        upAnimPromise = controls.start({
          y: -(screenHeight + overshoot),
          scale: 2,
          transition: { type: 'spring', stiffness: 360, damping: 30 }
        });
      }

      const serverPromise = perkInstance.handleApply(activeClient, gameData.id);

      if (upAnimPromise) await upAnimPromise;
      await serverPromise;

      if (motionData) {
        const { controls } = motionData;
        // Запускаем вспышку и падение в центр
        setExplosionPerkId(activePerk);
        await controls.start({
          y: -screenHeight / 2,
          scale: 0.8,
          transition: { type: 'spring', stiffness: 180, damping: 12 }
        });
        await controls.start({
          opacity: 0,
          transition: { duration: 0.35, easing: 'ease-out' as any }
        });
      }

      // Удаляем перк из доступных
      setAvailablePerks(prev => prev.filter(p => p.id !== activePerk));
      setActivePerk(null);
      setAnimatingPerkId(null);
      setExplosionPerkId(null);

      console.log(`Перк ${activePerk} успешно применен с анимацией`);
    } catch (error) {
      console.error('Ошибка при применении перка:', error);
      // В случае ошибки вернем карту на исходную позицию, чтобы не зависала
      const motionData = perkMotionData[activePerk];
      if (motionData) {
        const { controls } = motionData;
        await controls.start({ x: 0, y: 0, scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 28 } });
      }
      setAnimatingPerkId(null);
      setExplosionPerkId(null);
      // Перек оставляем активным, чтобы можно было повторить
    }
  };

  return (
    <div className="flex flex-col items-center w-full h-full min-h-screen relative">
      {/* Game Invite HoverCard */}
      {gameInvite && (() => {
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
      {/* pt-6 flex flex-col items-center space-y-4 w-full */}
      <div className="absolute top-16 w-full flex flex-col items-center">
        <div className="flex items-center gap-3">
          {isWaitingForOpponent && (<>
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
          </>)}
          {currentTurn && (
            <div className={`px-4 py-2 text-sm rounded-lg border-2 ${currentTurn === 1
              ? 'bg-white border-black text-black'
              : 'bg-black border-white text-white'
              }`}>
              Ход {currentTurn === 1 ? 'белых' : 'черных'}
            </div>
          )}
        </div>
      </div>
      <div className="absolute bottom-6 w-full flex flex-col items-center">
        <div className="flex items-center gap-3">
          {userJoins.length === 0 && (
            <Badge variant="outline" className="px-4 py-2 text-sm border-2">
              Режим наблюдателя
            </Badge>
          )}
        </div>
      </div>
      <div className="flex-1 w-full flex items-center justify-center p-4">
        <div className="w-full h-full max-w-[min(80vw,80vh)] max-h-[min(80vw,80vh)] aspect-square relative">
          {/* <HoverCard
            force={1.3}
            maxRotation={10}
            maxLift={50}
            useDeviceOrientation={useOrientation}
            orientationSensitivity={orientationSensitivity}
            onOrientationData={setOrientationData}
          > */}
          <Board
            position={gameData.fen}
            onMove={userJoins.length > 0 && !isWaitingForOpponent ? handleMove : undefined}
            orientation={boardOrientation}
            bgBlack={theme === "dark" ? '#3b0764' : '#c084fc'}
            bgWhite={theme === "dark" ? '#581c87' : '#dfbfff'}
            whitePiecesStyle={whitePiecesStyle}
            blackPiecesStyle={blackPiecesStyle}
            animation={true}
          />
          {/* Render perk effects */}
          {PERK_TYPES.map(perkType => {
            const EffectComponent = perkType.EffectComponent;
            if (EffectComponent) {
              return (
                <EffectComponent
                  key={`perk-effect-${perkType.id}`}
                  gameData={gameData}
                />
              );
            }
            return null;
          })}
          {/* </HoverCard> */}
        </div>
      </div>
      
      {/* Perks at bottom edge of screen */}
      {activeClient && (
        <div className="fixed bottom-0 left-0 right-0 flex justify-center items-end z-40" style={{ gap: '100px' }}>
          {availablePerks.map((perk, index) => {
            const motionData = perkMotionData[perk.id];
            if (!motionData) return null; // Защита от отсутствующих перков
            
            const { x, y, controls } = motionData;
            const isThisPerkActive = activePerk === perk.id;
            const isAnyPerkActive = activePerk !== null;
            const isDragDisabled = isAnyPerkActive && !isThisPerkActive;
            
            return (
              <div key={perk.id} className="w-px h-px relative">
                <motion.div 
                  className={`absolute left-0 top-0 transform -translate-x-1/2 -translate-y-1/2 ${
                    (isDragDisabled || animatingPerkId === perk.id) ? 'cursor-not-allowed opacity-50' : 
                    isThisPerkActive ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'
                  } z-40`}
                  drag={!isDragDisabled && animatingPerkId !== perk.id}
                  dragElastic={0.2}
                  dragMomentum={false}
                  style={{ x, y }}
                  initial={{ opacity: 1, scale: 1 }}
                  animate={controls}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                  }}
                  onClick={() => {
                    // Клик по активному перку применяет его
                    if (isThisPerkActive && animatingPerkId !== perk.id) {
                      handleApplyActivePerk();
                    }
                  }}
                  onDragEnd={async (event, info) => {
                    if (animatingPerkId === perk.id) return;
                    const screenHeight = window.innerHeight;
                    const dragY = y.get(); // Получаем текущую Y позицию
                    
                    // Проверяем активацию: если подняли выше 30% от низа экрана
                    const activationThreshold = screenHeight * 0.3; // 30% от высоты экрана
                    const shouldActivate = Math.abs(dragY) > activationThreshold;

                    // Применяем перк: если подняли выше 70% от низа экрана
                    const applicationThreshold = screenHeight * 0.7; // 70% от высоты экрана
                    const shouldApply = Math.abs(dragY) > applicationThreshold;

                    if (shouldApply && isThisPerkActive) {
                      // Применяем перк
                      await handleApplyActivePerk();

                    } else  if (shouldActivate && !isThisPerkActive) {
                      // Активируем перк - фиксируем в центре экрана
                      setActivePerk(perk.id);
                      await controls.start({
                        x: 0,
                        y: -screenHeight / 2, // Центр экрана по Y
                        transition: {
                          type: "spring",
                          stiffness: 300,
                          damping: 30
                        }
                      });
                    } else if (isThisPerkActive) {
                      // Проверяем деактивацию: если опустили ниже 30%
                      const deactivationThreshold = screenHeight * 0.3;
                      const shouldDeactivate = Math.abs(dragY) < deactivationThreshold;
                      
                      if (shouldDeactivate) {
                        // Деактивируем - возвращаем в строй
                        setActivePerk(null);
                        await controls.start({
                          x: 0,
                          y: 0,
                          transition: {
                            type: "spring",
                            stiffness: 300,
                            damping: 30
                          }
                        });
                      } else {
                        // Остаемся в центре
                        await controls.start({
                          x: 0,
                          y: -screenHeight / 2,
                          transition: {
                            type: "spring",
                            stiffness: 300,
                            damping: 30
                          }
                        });
                      }
                    } else {
                      // Обычный возврат на исходную позицию
                      await controls.start({
                        x: 0,
                        y: 0,
                        transition: {
                          type: "spring",
                          stiffness: 300,
                          damping: 30
                        }
                      });
                    }
                  }}
                >
                  <div className="relative">
                    {/* Вспышка под картой во время падения (движется вместе с картой) */}
                    {explosionPerkId === perk.id && (
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none">
                        <Boracay 
                          size={360}
                          repeat={1}
                          delay={0}
                          color="#c084fc"
                          onComplete={() => {
                            if (explosionPerkId === perk.id) setExplosionPerkId(null);
                          }}
                        />
                      </div>
                    )}
                    <div className="relative z-10">
                      {perk.ItemComponent && (
                        <perk.ItemComponent size="small" />
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      )}
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
        },
        {
          perks: ['id', 'type', 'game_id', 'user_id', 'data', 'created_at', 'applied_at'],
        },
      ]
    },
    { skip: !gameId }
  );

  console.log('🎮 [GAME] Game data:', data);

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

  // Обрабатываем ошибки через тост
  useToastHandleGameError(error);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoaderCircle className="animate-spin h-8 w-8 text-purple-500" />
        <span className="ml-2">Loading game...</span>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Game not found</p>
      </div>
    );
  }

  return (
    <GameCore
      gameData={gameData}
      gameInvite={gameInvite}
      onJoinInvite={onJoinInvite}
      isJoining={isJoining}
    />
  );
} 