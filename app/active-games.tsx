'use client'

import React from 'react';
import { useHasyx, useSubscription } from 'hasyx';
import { LoaderCircle } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from 'hasyx/components/ui/carousel';
import Board from '../lib/board';
import { Badge } from 'hasyx/components/ui/badge';
import { useTheme } from 'hasyx/components/theme-switcher';

interface ActiveGamesProps {
  onGameClick?: (gameId: string) => void;
}

interface GameJoin {
  id: string;
  user_id: string;
  side: number;
  role: number;
}

interface GameData {
  id: string;
  fen: string;
  status: string;
  updated_at: string;
  joins: GameJoin[];
}

export default function ActiveGames({ onGameClick }: ActiveGamesProps) {
  const { theme } = useTheme();
  const hasyx = useHasyx();

  // Подписка на активные игры (continue/ready) с сортировкой по updated_at
  const { data: gamesData, loading } = useSubscription(
    {
      table: 'badma_games',
      where: {
        status: { _in: ['continue', 'ready'] }
      },
      returning: [
        'id',
        'fen',
        'status',
        'updated_at',
        {
          joins: [
            'id',
            'user_id',
            'side',
            'role'
          ]
        }
      ],
      order_by: { updated_at: 'desc' },
      limit: 15,
    },
    { skip: !hasyx.userId }
  );

  const games = React.useMemo(() => {
    if (Array.isArray(gamesData)) return gamesData;
    if (gamesData && (gamesData as any).badma_games) return (gamesData as any).badma_games;
    return [];
  }, [gamesData]);

  if (loading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <LoaderCircle className="animate-spin h-6 w-6 text-purple-500 mr-2" />
        <span>Загрузка активных игр...</span>
      </div>
    );
  }

  if (!games.length) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        Нет активных игр
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <h2 className="text-2xl font-semibold mb-4 text-center">Активные игры <span className="text-sm font-normal text-purple-500">({games.length == 15 ? '15+' : games.length})</span></h2>
      <Carousel
        className="w-full mx-none"
        opts={{
          dragFree: false,
          containScroll: "trimSnaps",
          watchDrag: (emblaApi, event) => {
            // Предотвращаем всплытие события к родительскому слайдеру
            event.stopPropagation();
            return true; // Разрешаем перетаскивание для этого слайдера
          }
        }}
      >
        <CarouselContent className="">
          {games.map((game: GameData) => {
            // Определяем участников
            const players = game.joins.filter(join => join.role === 1); // role 1 = player
            const whitePlayer = players.find(p => p.side === 1);
            const blackPlayer = players.find(p => p.side === 2);
            
            return (
              <CarouselItem 
                key={game.id}
                className="basis-[220px] flex-shrink-0"
              >
                <div 
                  className="flex flex-col items-center relative p-1 cursor-pointer hover:bg-muted/30 rounded-lg transition-colors w-[220px] h-full"
                  onClick={() => onGameClick?.(game.id)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  {/* Статус игры */}
                  {/* <Badge 
                    variant="secondary" 
                    className={`absolute -top-2 -right-2 text-white text-xs px-2 py-1 z-10 ${
                      game.status === 'continue' ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                  >
                    {game.status === 'continue' ? 'В игре' : 'Готова'}
                  </Badge> */}
                  
                  {/* Доска фиксированного размера 200px */}
                  <div className="w-[200px] h-[200px] mb-2">
                    <Board 
                      position={game.fen}
                      onMove={undefined} // Только для просмотра
                      orientation={1} // Всегда с точки зрения белых
                      bgBlack={theme === "dark" ? '#3b0764' : '#c084fc'}
                      bgWhite={theme === "dark" ? '#581c87' : '#faf5ff'}
                    />
                  </div>
                   
                  {/* Информация об игре */}
                  {/*<div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">
                      ID: {game.id.substring(0, 8)}...
                    </p>
                    <div className="text-xs text-muted-foreground">
                      <div>👤 Белые: {whitePlayer ? 'Занято' : 'Свободно'}</div>
                      <div>👤 Черные: {blackPlayer ? 'Занято' : 'Свободно'}</div>
                    </div>
                    {game.updated_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Обновлено: {new Date(game.updated_at).toLocaleDateString()}
                      </p>
                    )}
                  </div> */}
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
