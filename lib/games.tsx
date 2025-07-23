'use client'

import React from 'react';
import { Gamepad2 } from 'lucide-react';
import ActiveGames from '../app/active-games';
import UserGames from '../app/my-games';

interface GamesProps {
  currentUserId: string;
  onGameClick: (gameId: string) => void;
  children?: React.ReactNode;
}

export default function Games({ currentUserId, onGameClick, children }: GamesProps) {
  return (
    <>
      <div className="flex flex-col items-center justify-start p-4 overflow-y-auto">
        <div className="w-full space-y-8">
          {/* Заголовок */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <Gamepad2 className="h-6 w-6 text-purple-500" />
            <h2 className="text-2xl font-bold">Games</h2>
          </div>

          {/* Активные игры с фиксированной высотой */}
          <div className="h-[300px] w-full">
            <ActiveGames onGameClick={onGameClick} />
          </div>

          {/* Мои игры с табами */}
          <div className="max-w-4xl">
            <h2 className="text-2xl font-bold mb-4 text-center">Мои игры</h2>
            <div className="w-full">
              {/* UserGames компонент с табами, содержимое табов будет скроллиться */}
              <div className="flex flex-col">
                {/* Компонент UserGames с фиксированными табами и скроллируемым контентом */}
                <UserGames
                  userId={currentUserId}
                  onGameClick={onGameClick}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Рендер дочерних компонентов */}
      {children}
    </>
  );
}
