'use client'

import React, { useState } from 'react';
import { Gamepad2 } from 'lucide-react';
import ActiveGames from '../app/active-games';
import UserGames from '../app/my-games';
import { Button } from 'hasyx/components/ui/button';
import { Loader2 } from 'lucide-react';
import { PlusCircle } from 'lucide-react';
import { toast } from "sonner";
import { ChessClientRole } from './chess-client';
import { AxiosChessClient } from './axios-chess-client';
import { ChessClientSide } from './chess-client';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

interface GamesProps {
  currentUserId: string;
  onGameClick: (gameId: string) => void;
  children?: React.ReactNode;
}

export default function Games({ currentUserId, onGameClick, children }: GamesProps) {
  const [isCreatingGame, setIsCreatingGame] = useState(false);

  const handleCreateGame = async () => {
    if (!currentUserId) {
      toast.error("User not authenticated");
      return;
    }

    setIsCreatingGame(true);
    try {
      // Create axios instance with session
      const axiosInstance = axios.create({
        baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true, // Include session cookies
      });

      // Create AxiosChessClient
      const chessClient = new AxiosChessClient(axiosInstance);
      chessClient.userId = currentUserId;
      chessClient.clientId = uuidv4();

      // Create game
      const createResponse = await chessClient.asyncCreate(1); // White side
      
      if (createResponse.error) {
        toast.error(`Failed to create game: ${createResponse.error}`);
        return;
      }

      if (createResponse.data?.gameId) {
        // Join the created game as a player
        const joinResponse = await chessClient.asyncJoin(1, ChessClientRole.Player);
        
        if (joinResponse.error) {
          toast.error(`Failed to join game: ${joinResponse.error}`);
          return;
        }

        // Open the created game
        onGameClick(createResponse.data.gameId);
        toast.success("Game created and joined successfully!");
      } else {
        toast.error("Failed to create game: No game ID returned");
      }
    } catch (error: any) {
      console.error('Error creating game:', error);
      toast.error(`Failed to create game: ${error.message || 'Unknown error'}`);
    } finally {
      setIsCreatingGame(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center justify-start p-4 overflow-y-auto h-full">
        <div className="w-full space-y-8 flex flex-col items-center">
          {/* Заголовок */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <Gamepad2 className="h-6 w-6 text-purple-500" />
            <h2 className="text-2xl font-bold">Games</h2>
            <Button
              variant="outline"
              size="icon"
              className="text-white flex flex-col items-center justify-center aspect-square"
              onClick={handleCreateGame}
              disabled={isCreatingGame}
            >
              {isCreatingGame ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Активные игры с фиксированной высотой */}
          <div className="h-[300px] w-full">
            <ActiveGames onGameClick={onGameClick} />
          </div>

          <div className="flex flex-col items-center h-full w-full max-w-[1000px]">
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
