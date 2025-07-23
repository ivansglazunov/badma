"use client";

import { LogOut, LoaderCircle, Crown, Joystick, X, Trophy, Gamepad2, PlusCircle, Users, ListChecks, Shirt, Sparkles, Globe, User, Loader2 } from "lucide-react";
import { signOut, useSession, getSession } from "next-auth/react";
import React, { useState, useEffect, useRef } from "react";
import packageJson from '../package.json';

import { useClient, useHasyx, useSubscription } from "hasyx";
import { createApolloClient, Generator, Hasyx } from "hasyx";
import { Avatar, AvatarFallback, AvatarImage } from "hasyx/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "hasyx/components/ui/tabs";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "hasyx/components/ui/carousel";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "hasyx/components/ui/dialog";

import Board from "@/lib/board";
import Game from "@/lib/game";
import { OAuthButtons } from "hasyx/components/auth/oauth-buttons";
import { useTheme } from "hasyx/components/theme-switcher";
import { Button } from "hasyx/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "hasyx/components/ui/card"
import { Badge } from "hasyx/components/ui/badge"
import { Input } from "hasyx/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "hasyx/components/ui/select";
import { Label } from "hasyx/components/ui/label";
import { Separator } from "hasyx/components/ui/separator";
import axios from "axios";
import { toast } from "sonner";

import { cn } from "hasyx/lib/utils"
import { useMounted } from "@/hooks/mounted";
import { useToastHandleParticipantsError, useToastHandleGamesError, useToastHandleTournamentsError } from "@/hooks/toasts";
import schema from "@/public/hasura-schema.json";
import { BOARD_STYLES, getBoardStyle, SUPPORTED_ITEMS } from "@/lib/items";
import Skins from "@/app/skins";
import { Badma_Tournament_Games, Badma_Tournaments } from "@/types/hasura-types";
import { tournaments, tournamentDescriptions } from '@/lib/tournaments';
import { HoverCard } from "@/components/hover-card";
import { useDeviceMotionPermissions, useDeviceOrientationPermissions } from "@/hooks/device-permissions";
import { ClubTab } from "./club";
import { ClubsList } from "./clubs";
import { CheckClub } from "./check-club";
import CheckAvailableItems from "./check-available-items";
import { useClubStore } from "@/lib/stores/club-store";
import { useUserSettingsStore } from "@/lib/stores/user-settings-store";
import { AxiosChessClient } from "@/lib/axios-chess-client";

import { ChessClientRole, ChessClientSide } from "@/lib/chess-client";
import { v4 as uuidv4 } from 'uuid';

const getStatusBadgeClass = (status: Badma_Tournaments['status']): string => {
  switch (status) {
    case 'await':

      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200';
    case 'ready':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-200';
    case 'continue':
      return 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200';
    case 'finished':
      return 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300';
  }
};

const TournamentParticipantsTab: React.FC<{ tournamentId: string }> = ({ tournamentId }) => {
  const { data, loading, error } = useSubscription(
    {
      table: 'badma_tournament_participants',
      where: {
        tournament_id: { _eq: tournamentId },
        role: { _eq: 1 }
      },
      returning: [
        'id',
        'user_id',
        {
          user: ['id', 'name', 'image']
        },
        {
          scores_aggregate: {
            aggregate: {
              sum: ['score']
            }
          }
        }
      ]
    },
    { skip: !tournamentId, role: 'user' }
  );

  // Get games for participants separately to avoid complex nested queries
  const { data: gamesData } = useSubscription(
    {
      table: 'badma_joins',
      where: {
        role: { _eq: 1 },
        game: {
          tournament_games: {
            tournament_id: { _eq: tournamentId }
          }
        }
      },
      returning: [
        'id',
        'user_id',
        {
          game: [
            'id',
            'status',
            {
              moves: ['id']
            }
          ]
        }
      ]
    },
    { skip: !tournamentId }
  );

  const participants = React.useMemo(() => {
    if (Array.isArray(data)) return data;
    if (data && (data as any).badma_tournament_participants) return (data as any).badma_tournament_participants;
    return [];
  }, [data]);

  const gamesByUser = React.useMemo(() => {
    const games = Array.isArray(gamesData) ? gamesData : (gamesData as any)?.badma_joins || [];
    const grouped: Record<string, any[]> = {};
    games.forEach((join: any) => {
      if (!grouped[join.user_id]) grouped[join.user_id] = [];
      grouped[join.user_id].push(join.game);
    });
    return grouped;
  }, [gamesData]);

  // Обрабатываем ошибки через тост
  useToastHandleParticipantsError(error);

  if (loading) return <div className="flex items-center justify-center p-4"><LoaderCircle className="animate-spin h-6 w-6 text-purple-500 mr-2" /> Loading participants...</div>;
  if (!participants.length) return <p className="p-4 text-muted-foreground">No active participants found for this tournament.</p>;

  return (
    <div className="space-y-4 p-1">
      {participants.map((participant: any) => {
        const totalScore = participant.scores_aggregate?.aggregate?.sum?.score || 0;
        const userGames = gamesByUser[participant.user_id] || [];
        
        return (
          <div key={participant.id} className="p-3 hover:bg-muted/30 rounded-md border border-muted/20">
            <div className="flex items-center space-x-3 mb-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={participant.user?.image ?? undefined} alt={participant.user?.name ?? 'User'} />
                <AvatarFallback>{participant.user?.name?.charAt(0)?.toUpperCase() ?? 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <span className="text-sm font-medium text-foreground">{participant.user?.name ?? 'Anonymous User'}</span>
                <div className="text-xs text-muted-foreground">
                  Total Score: <span className="font-medium text-green-600">{totalScore}</span>
                </div>
              </div>
            </div>
            {userGames.length > 0 && (
              <div className="ml-11 space-y-1">
                <div className="text-xs font-medium text-muted-foreground mb-1">Games ({userGames.length}):</div>
                {userGames.map((game: any) => (
                  <div 
                    key={game.id} 
                    className="flex items-center justify-between text-xs bg-muted/30 rounded px-2 py-1 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering parent click handlers
                      handleOpenGameGlobal(game.id);
                    }}
                  >
                    <span className="font-mono">{game.id.substring(0, 8)}...</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-muted-foreground">
                        {game.moves?.length || 0} moves
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        game.status === 'finished' || game.status === 'checkmate' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {game.status ?? 'Unknown'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

let handleOpenGameGlobal: (gameId: string) => void = () => {};

const TournamentGamesTab: React.FC<{ tournamentId: string }> = ({ tournamentId }) => {
  const { data, loading, error } = useSubscription(
    {
      table: 'badma_tournament_games',
      where: { tournament_id: { _eq: tournamentId } },
      returning: [
        'id', 
        { 
          game: [
            'id', 
            'status',
            {
              moves: ['id']
            }
          ] 
        }
      ]
    },
    { skip: !tournamentId }
  );
 const games: Badma_Tournament_Games[] = React.useMemo(() => {
    if (Array.isArray(data)) return data as Badma_Tournament_Games[];
    if (data && (data as any).badma_tournament_games) return (data as any).badma_tournament_games as Badma_Tournament_Games[];
    return [];
  }, [data]);

  // Обрабатываем ошибки через тост
  useToastHandleGamesError(error);

  if (loading) return <div className="flex items-center justify-center p-4"><LoaderCircle className="animate-spin h-6 w-6 text-purple-500 mr-2" /> Loading games...</div>;
  if (!games.length) return <p className="p-4 text-muted-foreground">No games found for this tournament.</p>;

  return (
    <div className="space-y-2 p-1">
      {games.map(tg => {
        const moveCount = tg.game.moves?.length || 0;
        
        return (
          <div 
            key={tg.id} 
            className="flex items-center justify-between p-3 hover:bg-muted/30 rounded-md cursor-pointer border border-muted/20"
            onClick={() => handleOpenGameGlobal(tg.game.id)}
          >
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">Game ID: {tg.game.id.substring(0, 8)}...</span>
              <span className="text-xs text-muted-foreground">{moveCount} moves played</span>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              tg.game.status === 'finished' || tg.game.status === 'checkmate'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : tg.game.status 
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
            }`}>
              {tg.game.status ?? 'Unknown'}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// User Profile Components
const UserProfileGamesTab: React.FC<{ userId: string }> = ({ userId }) => {
  const { data, loading, error } = useSubscription(
    {
      table: 'badma_joins',
      where: { 
        user_id: { _eq: userId },
        role: { _eq: 1 } // Only player joins
      },
      returning: [
        'id',
        'side',
        {
          game: [
            'id',
            'status',
            'created_at',
            'updated_at',
            {
              moves: ['id']
            }
          ]
        }
      ],
      order_by: { created_at: 'desc' }
    },
    { skip: !userId }
  );

  const games = React.useMemo(() => {
    if (Array.isArray(data)) return data;
    if (data && (data as any).badma_joins) return (data as any).badma_joins;
    return [];
  }, [data]);

  // Обрабатываем ошибки через тост
  useToastHandleGamesError(error);

  if (loading) return <div className="flex items-center justify-center p-4"><LoaderCircle className="animate-spin h-6 w-6 text-purple-500 mr-2" /> Loading games...</div>;
  if (!games.length) return <p className="p-4 text-muted-foreground">No games found.</p>;

  return (
    <div className="space-y-2 p-1">
      {games.map((join: any) => {
        const game = join.game;
        const moveCount = game.moves?.length || 0;
        const isFinished = ['finished', 'checkmate', 'stalemate', 'draw', 'white_surrender', 'black_surrender'].includes(game.status);
        const sideText = join.side === 1 ? 'White' : 'Black';
        
        return (
          <div 
            key={join.id} 
            className="flex items-center justify-between p-3 hover:bg-muted/30 rounded-md cursor-pointer border border-muted/20"
            onClick={() => handleOpenGameGlobal(game.id)}
          >
            <div className="flex flex-col flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-foreground">Game ID: {game.id.substring(0, 8)}...</span>
                <span className="text-xs px-1.5 py-0.5 bg-muted rounded">{sideText}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                <span>{moveCount} moves</span>
                {game.created_at && (
                  <span className="ml-3">Created: {new Date(game.created_at).toLocaleDateString()}</span>
                )}
                {game.updated_at && game.updated_at !== game.created_at && (
                  <span className="ml-3">Updated: {new Date(game.updated_at).toLocaleDateString()}</span>
                )}
              </div>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              isFinished
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            }`}>
              {game.status ?? 'Unknown'}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const UserProfileTournamentsTab: React.FC<{ userId: string }> = ({ userId }) => {
  const { data, loading, error } = useSubscription(
    {
      table: 'badma_tournament_participants',
      where: { 
        user_id: { _eq: userId },
        role: { _eq: 1 } // Only player participation
      },
      returning: [
        'id',
        {
          tournament: [
            'id',
            'type',
            'status',
            'created_at'
          ]
        },
        {
          scores_aggregate: {
            aggregate: {
              sum: ['score']
            }
          }
        }
      ],
      order_by: { created_at: 'desc' }
    },
    { skip: !userId }
  );

  // Get tournament scores to find max scores
  const { data: allScoresData } = useSubscription(
    {
      table: 'badma_tournament_scores',
      returning: [
        'tournament_id',
        'participant_id',
        'score'
      ]
    }
  );

  const tournaments = React.useMemo(() => {
    if (Array.isArray(data)) return data;
    if (data && (data as any).badma_tournament_participants) return (data as any).badma_tournament_participants;
    return [];
  }, [data]);

  const maxScoresByTournament = React.useMemo(() => {
    const scores = Array.isArray(allScoresData) ? allScoresData : (allScoresData as any)?.badma_tournament_scores || [];
    const maxScores: Record<string, number> = {};
    
    scores.forEach((score: any) => {
      const tournamentId = score.tournament_id;
      if (!maxScores[tournamentId] || score.score > maxScores[tournamentId]) {
        maxScores[tournamentId] = score.score;
      }
    });
    
    return maxScores;
  }, [allScoresData]);

  // Обрабатываем ошибки через тост
  useToastHandleTournamentsError(error);

  if (loading) return <div className="flex items-center justify-center p-4"><LoaderCircle className="animate-spin h-6 w-6 text-purple-500 mr-2" /> Loading tournaments...</div>;
  if (!tournaments.length) return <p className="p-4 text-muted-foreground">No tournaments found.</p>;

  return (
    <div className="space-y-2 p-1">
      {tournaments.map((participant: any) => {
        const tournament = participant.tournament;
        const userScore = participant.scores_aggregate?.aggregate?.sum?.score || 0;
        const maxScore = maxScoresByTournament[tournament.id] || 0;
        
        return (
          <div 
            key={participant.id} 
            className="p-3 hover:bg-muted/30 rounded-md border border-muted/20"
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-col flex-1">
                <span className="text-sm font-medium text-foreground">{tournament.type}</span>
                <span className="text-xs text-muted-foreground">ID: {tournament.id.substring(0, 8)}...</span>
                <div className="text-xs text-muted-foreground mt-1">
                  Score: <span className="font-medium text-green-600">{userScore}</span>
                  {maxScore > 0 && (
                    <span> / <span className="text-yellow-600">{maxScore}</span> max</span>
                  )}
                  {tournament.created_at && (
                    <span className="ml-3">Created: {new Date(tournament.created_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusBadgeClass(tournament.status)}`}>
                {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export function GameCard({ disabled = false }: { disabled?: boolean }) {
  return <Card className={`w-[min(15vw,15vh)] h-[min(30vw,30vh)] transform ${disabled ? "" : "hover:-translate-y-20 hover:scale-120"} transition-all duration-300 shadow-xl/30`}>
  </Card>;
}

export function GameCards({ disabled = false, className }: { disabled?: boolean, className?: string }) {
  return (
    <div className={cn("absolute w-full flex items-center justify-center", className)}>
      <div className="transform -rotate-35 translate-y-0"><GameCard disabled={disabled} /></div>
      <div className="transform -rotate-20 translate-y-0"><GameCard disabled={disabled} /></div>
      <div className="transform rotate-0 translate-y-0"><GameCard disabled={disabled} /></div>
      <div className="transform rotate-20 translate-y-0"><GameCard disabled={disabled} /></div>
      <div className="transform rotate-35 translate-y-0"><GameCard disabled={disabled} /></div>
    </div>
  );
}

export function GameClassic() {
  const { theme, setTheme } = useTheme();
  return (
    <>
      <div className="aspect-square w-full h-full max-w-[min(70vw,70vh)] max-h-[min(70vw,70vh)]">
        <Board position="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
          bgBlack={theme === "dark" ? '#3b0764' : '#c084fc'}
          bgWhite={theme === "dark" ? '#581c87' : '#faf5ff'}
        />
      </div>
    </>
  );
}

export function GameFree() {
  const session = useSession();
  const mounted = useMounted();
  const { theme, setTheme } = useTheme();
  return (
    <>
      <div className="w-full flex flex-row relative z-2">
        <div className="flex-grow"></div>
        <div className={`bg-transparent border-none p-3`}>
          <Avatar className={`relative transition-all duration-300 size-25 transform`}>
            {!!session?.data?.user?.image && <AvatarImage src={session?.data?.user?.image} />}
            <AvatarFallback>{session?.data?.user?.name || '?'}</AvatarFallback>
            {session?.status === "loading" && <LoaderCircle className="animate-spin absolute top-0 left-0 w-full h-full"/>}
          </Avatar>
        </div>
        <div className="flex-grow"></div>
      </div>
      <div className="aspect-square w-full h-full max-w-[min(70vw,70vh)] max-h-[min(70vw,70vh)]">
        <Board position="qqqqkqqq/pppppppp/pppppppp/8/8/PPPPPPPP/PPPPPPPP/QQQQKQQQ w - - 0 1"
          bgBlack={theme === "dark" ? '#3b0764' : '#c084fc'}
          bgWhite={theme === "dark" ? '#581c87' : '#faf5ff'}
        />
      </div>
      <GameCards className={`top-0 left-0 -rotate-180 transition-all duration-300 ${mounted ? "-translate-y-35" : "-translate-y-300"}`} disabled/>
      <GameCards className={`bottom-0 left-0 transition-all duration-300 ${mounted ? "translate-y-40" : "translate-y-300"}`}/>
    </>
  );
}

export default function App() {
  const { data: session, status: sessionStatus } = useSession();
  const user = session?.user;
  const { theme, setTheme } = useTheme();
  const hasyx = useHasyx();
  
  // Function to save board style settings
  const saveBoardStyleSetting = async (boardStyleId: string) => {
    if (!hasyx.userId) return;
    
    setIsSavingBoardStyle(true);
    try {
      await hasyx.insert({
        table: 'badma_settings',
        object: {
          user_id: hasyx.userId,
          key: 'board',
          value: boardStyleId
        },
        on_conflict: {
          constraint: 'settings_user_key_unique',
          update_columns: ['value']
        }
      });
      
      toast.success('Настройки доски сохранены');
    } catch (error) {
      console.error('Error saving board style setting:', error);
      toast.error('Ошибка при сохранении настроек доски');
    } finally {
      setIsSavingBoardStyle(false);
    }
  };

  // Auto-request device permissions on app load
  const motionPermissions = useDeviceMotionPermissions(true);
  const orientationPermissions = useDeviceOrientationPermissions(true);
  // Get current user's full data including ID
  const { data: currentUserData, loading: userLoading } = useSubscription(
    {
      table: 'users',
      where: { id: { _eq: hasyx.userId } },
      returning: ['id', 'name', 'image'],
      limit: 1
    },
    { skip: !hasyx.userId }
  );

  // Get clubs data for current user
  const { data: clubsData, loading: clubsLoading, error: clubsError } = useSubscription(
    {
      table: 'badma_clubs',
      where: { 
        _or: [
          { user_id: { _eq: hasyx.userId } }, 
          { in_clubs: { user_id: { _eq: hasyx.userId } } }
        ] 
      },
      returning: [
        'id',
        'user_id',
        'title',
        'created_at',
        'updated_at',
        {
          user: ['id', 'name', 'image']
        },
        {
          in_clubs: [
            'id',
            'user_id',
            'status',
            'created_by_id',
            'created_at',
            'updated_at',
            {
              user: ['id', 'name', 'image']
            },
            {
              created_by: ['id', 'name', 'image']
            }
          ]
        }
      ]
    },
    { skip: !hasyx.userId }
  );

  // Get all user settings
  const { data: settingsData } = useSubscription(
    {
      table: 'badma_settings',
      where: {
        user_id: { _eq: hasyx.userId }
      },
      returning: ['id', 'key', 'value']
    },
    { skip: !hasyx.userId }
  );

  // Zustand stores
  const { setUserClubs, setLoading, setError } = useClubStore();
  const { setSettings, getSetting, setLoading: setSettingsLoading, setError: setSettingsError } = useUserSettingsStore();

  // Update user settings in store when data changes
  React.useEffect(() => {
    if (settingsData) {
      setSettings(settingsData);
      // Update selected board style from store
      const boardStyle = getSetting('board');
      setSelectedBoardStyle(boardStyle);
    }
  }, [settingsData, setSettings, getSetting]);

  // Format clubs data for display and save to Zustand
  const clubsDataFormatted = React.useMemo(() => {
    if (!clubsData) return null;
    
    let formattedData;
    if (Array.isArray(clubsData)) {
      formattedData = clubsData;
    } else if (clubsData && (clubsData as any).badma_clubs) {
      formattedData = (clubsData as any).badma_clubs;
    } else {
      formattedData = clubsData;
    }

    // Save to Zustand store
    if (formattedData && Array.isArray(formattedData)) {
      setUserClubs(formattedData);
    }

    return formattedData;
  }, [clubsData, setUserClubs]);

  // Update loading and error states in Zustand
  React.useEffect(() => {
    setLoading(clubsLoading);
    setError(clubsError ? (clubsError as any)?.message || "Unknown error" : null);
  }, [clubsLoading, clubsError, setLoading, setError]);

  // Calculate current user ID - use hasyx.userId directly since it's the UUID from our database
  const currentUserId = hasyx.userId;

  const [carouselApi, setCarouselApi] = useState<CarouselApi | undefined>();
  const viewOrder = React.useMemo(() => ['profile', 'tournaments', 'games', 'skins'], []);
  const [mainViewTab, setMainViewTab] = useState(viewOrder[1]);
  const [profileTab, setProfileTab] = useState('tournaments');
  const [profile, setProfile] = useState(false);

  // Function to navigate to club hall
  const navigateToClubHall = () => {
    setMainViewTab('profile');
    setProfileTab('club');
  };
  const [selectedTournament, setSelectedTournament] = useState<Badma_Tournaments | null>(null);
  const [isTournamentModalOpen, setIsTournamentModalOpen] = useState(false);
  const [isCreateTournamentModalOpen, setIsCreateTournamentModalOpen] = useState(false);
  const [newTournamentType, setNewTournamentType] = useState('round-robin');
  const [isCreatingTournament, setIsCreatingTournament] = useState(false);
  const [isAddingAiPlayers, setIsAddingAiPlayers] = useState(false);
  const [isStartingTournament, setIsStartingTournament] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [showPermissionToast, setShowPermissionToast] = useState(false);
  const [isCheckClubOpen, setIsCheckClubOpen] = useState(false);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [gameInvite, setGameInvite] = useState<{
    gameId: string;
    side: number;
    role: number;
  } | null>(null);
  const [pendingInvite, setPendingInvite] = useState<{
    gameId: string;
    side: number;
    role: number;
  } | null>(null);
  
  // Board style settings
  const [selectedBoardStyle, setSelectedBoardStyle] = useState('classic_board');
  const [isSavingBoardStyle, setIsSavingBoardStyle] = useState(false);


  
  const isAuthenticated = sessionStatus === "authenticated";
  const isLoadingSession = sessionStatus === "loading";

  // Extract URL parameters on initial load (before authentication)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('gameId');
    const side = urlParams.get('side');
    const role = urlParams.get('role');
    
    console.log('🔍 [INVITE] URL params:', { gameId, side, role, fullUrl: window.location.href });
    
    if (gameId && side && role) {
      console.log('✅ [INVITE] Valid invite parameters found, clearing URL and saving to pendingInvite');
      
      // Clear URL parameters immediately
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Save invite data for later processing
      const inviteData = {
        gameId,
        side: parseInt(side),
        role: parseInt(role)
      };
      
      console.log('💾 [INVITE] Saving pending invite:', inviteData);
      setPendingInvite(inviteData);
    } else {
      console.log('❌ [INVITE] No valid invite parameters found');
    }
  }, []); // Run only once on mount

  // Process pending invite after authentication
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('⏳ [INVITE] Waiting for authentication...');
      return;
    }
    
    if (!currentUserId) {
      console.log('⏳ [INVITE] Waiting for currentUserId...');
      return;
    }
    
    if (!pendingInvite) {
      console.log('🚨 [INVITE] No pending invite to process');
      return;
    }
    
    console.log('✅ [INVITE] All conditions met, processing pending invite:', pendingInvite);
    
    // Move pending invite to active invite
    console.log('🔄 [INVITE] Moving pending invite to active gameInvite');
    setGameInvite(pendingInvite);
    setPendingInvite(null);
    
    // Open the game for preview
    console.log('🎮 [INVITE] Opening game for preview:', pendingInvite.gameId);
    handleOpenGame(pendingInvite.gameId);
  }, [isAuthenticated, currentUserId, pendingInvite]);

  const handleOpenGame = (gameId: string) => {
    console.log('🔓 [OPEN_GAME] Opening game:', gameId);
    setSelectedGameId(gameId);
    if (profile) setProfile(false);
    console.log('🔓 [OPEN_GAME] Game opened, selectedGameId set to:', gameId);
  };
  
  useEffect(() => {
    handleOpenGameGlobal = handleOpenGame;
  }, [profile, handleOpenGame]);

  const handleCloseGame = () => {
    setSelectedGameId(null);
    setGameInvite(null); // Clear invite data when closing game
  };

  const handleJoinGameFromInvite = async () => {
    console.log('🎮 handleJoinGameFromInvite called with:', { gameInvite, currentUserId, session });
    if (!gameInvite || !currentUserId || !session) {
      console.log('❌ Missing gameInvite, currentUserId, or session');
      return;
    }
    
    try {
      setIsCreatingGame(true);
      
      // Get fresh session for verification
      const freshSession = await getSession();
      console.log('🔑 Fresh session exists:', !!freshSession);
      
      // Create axios instance with session credentials (same as handleCreateGame)
      const axiosInstance = axios.create({
        baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true, // Include session cookies
      });
      
      console.log('🍪 Using cookie-based authentication like handleCreateGame');
      
      // Create chess client
      const clientId = uuidv4();
      const chessClient = new AxiosChessClient(axiosInstance);
      chessClient.clientId = clientId;
      chessClient.userId = currentUserId;
      chessClient.gameId = gameInvite.gameId;
      
      // Join the game
      console.log('🚀 Attempting to join game with:', {
        gameId: gameInvite.gameId,
        side: gameInvite.side,
        role: gameInvite.role,
        clientId: chessClient.clientId,
        userId: chessClient.userId
      });
      
      const joinResponse = await chessClient.asyncJoin(gameInvite.side as ChessClientSide, gameInvite.role as ChessClientRole);
      
      console.log('🎯 Join response:', joinResponse);
      
      if (joinResponse.error) {
        console.error('❌ Join failed:', joinResponse.error);
        toast.error(`Failed to join game: ${joinResponse.error}`);
        return;
      }
      
      // Clear invite data after successful join
      setGameInvite(null);
      toast.success("Successfully joined the game!");
      
    } catch (error: any) {
      console.error('Failed to join game from invite:', error);
      toast.error(`Failed to join game: ${error.message || 'Unknown error'}`);
    } finally {
      setIsCreatingGame(false);
    }
  };

  const handleTournamentClick = (tournament: Badma_Tournaments) => {
    setSelectedTournament(tournament);
    setIsTournamentModalOpen(true);
  };

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
        handleOpenGame(createResponse.data.gameId);
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

  const {
    data: tournamentsData,
    loading: tournamentsLoading,
    error: tournamentsError,
  } = useSubscription(
    {
      table: 'badma_tournaments',
      returning: [
        'id', 
        'user_id',
        'status', 
        'type', 
        'created_at',
        { 
          tournament_games: [
            'id',
            { 
              game: [
                'id', 
                'status'
              ] 
            }
          ] 
        },
        { 
          participants: [
            'id', 
            'user_id', 
            'role'
          ] 
        }
      ], 
      order_by: { created_at: 'desc' }
    },
    {
      skip: !isAuthenticated,
    }
  );

  const actualTournaments: Badma_Tournaments[] = React.useMemo(() => {
    if (Array.isArray(tournamentsData)) {
      return tournamentsData as Badma_Tournaments[];
    }
    if (tournamentsData && (tournamentsData as any).badma_tournaments) {
       return (tournamentsData as any).badma_tournaments as Badma_Tournaments[];
    }
    if (tournamentsData && (tournamentsData as any).tournaments) {
       return (tournamentsData as any).tournaments as Badma_Tournaments[];
    }
    return [];
  }, [tournamentsData]);

  // Обрабатываем ошибки через тост
  useToastHandleTournamentsError(tournamentsError);

  useEffect(() => {
    if (!carouselApi) return;

    const selectedIndex = viewOrder.indexOf(mainViewTab);
    if (selectedIndex !== -1 && selectedIndex !== carouselApi.selectedScrollSnap()) {
      carouselApi.scrollTo(selectedIndex);
    }

    const handleSelect = () => {
      const currentSnap = carouselApi.selectedScrollSnap();
      if (viewOrder[currentSnap] !== mainViewTab) {
        setMainViewTab(viewOrder[currentSnap]);
      }
    };

    carouselApi.on("select", handleSelect);

    return () => {
      if (carouselApi) {
        carouselApi.off("select", handleSelect);
      }
    };
  }, [carouselApi, mainViewTab, viewOrder]);

  const handleCreateTournament = async () => {
    if (!currentUserId) return;
    
    setIsCreatingTournament(true);
    try {
      const result = await hasyx.insert({
        table: 'badma_tournaments',
        object: {
          user_id: currentUserId,
          status: 'await',
          type: newTournamentType,
        },
        returning: ['id', 'status', 'type', 'created_at', 'user_id']
      });

      setIsCreateTournamentModalOpen(false);
      setSelectedTournament(result);
      setIsTournamentModalOpen(true);
      setNewTournamentType('round-robin'); // Reset form
    } catch (error) {
      console.error('Error creating tournament:', error);
    } finally {
      setIsCreatingTournament(false);
    }
  };

  const handleAddAiPlayers = async () => {
    if (!selectedTournament) return;
    
    setIsAddingAiPlayers(true);
    try {
      await axios.post('/api/badma/tournament-ai', null, {
        params: { id: selectedTournament.id }
      });
      
      // Refresh tournament data after adding AI players
      // The subscription should automatically update the participants
    } catch (error) {
      console.error('Error adding AI players:', error);
    } finally {
      setIsAddingAiPlayers(false);
    }
  };

  const handleStartTournament = async () => {
    if (!selectedTournament) return;
    
    setIsStartingTournament(true);
    try {
      const response = await axios.post('/api/badma/tournament-start', null, {
        params: { id: selectedTournament.id }
      });
      
      // Show success toast if tournament started successfully
      if (response.data.success) {
        toast.success("Tournament Started");
      }
      
      // The subscription should automatically update the tournament status
    } catch (error: any) {
      console.error('Error starting tournament:', error);
      
      // Show error toast
      toast.error("Failed to Start Tournament");
    } finally {
      setIsStartingTournament(false);
    }
  };

  // Show toast when permissions need user interaction
  useEffect(() => {
    if (motionPermissions.needsUserInteraction || orientationPermissions.needsUserInteraction) {
      setShowPermissionToast(true);
      
      // Auto-hide toast after 5 seconds
      const timer = setTimeout(() => {
        setShowPermissionToast(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [motionPermissions.needsUserInteraction, orientationPermissions.needsUserInteraction]);

  if (isLoadingSession) {
    return (
      <div className="flex flex-1 flex-col bg-background items-center justify-center h-screen">
        <LoaderCircle className="animate-spin h-12 w-12 text-purple-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-1 flex-col bg-background items-center justify-center h-screen p-4">
        <OAuthButtons />
      </div>
    );
  }

  return (<>
    {/* Version indicator - fixed top left with very high z-index */}
    <div className="fixed top-2 left-2 z-[9999] px-2 py-1 bg-black/20 backdrop-blur-sm rounded text-xs text-white/70 font-mono pointer-events-none">
      v{packageJson.version}
    </div>
    
    <div className="flex flex-1 flex-col bg-background relative h-screen max-h-screen overflow-hidden">
      <div className="absolute top-3 right-3 z-50 flex flex-col gap-2">
        {/* Device Permissions Status - Only show if supported */}
        {(motionPermissions.isSupported || orientationPermissions.isSupported) && (
          <>
            <div className="flex gap-2 text-xs">
              {motionPermissions.isSupported && (
                <div className={`px-2 py-1 rounded-full text-white text-xs ${
                  motionPermissions.permissionStatus === 'granted' ? 'bg-green-500' :
                  motionPermissions.permissionStatus === 'denied' ? 'bg-red-500' :
                  motionPermissions.permissionStatus === 'requesting' ? 'bg-yellow-500' :
                  'bg-gray-500'
                }`}>
                  📱 {motionPermissions.permissionStatus}
                </div>
              )}
              {orientationPermissions.isSupported && (
                <div className={`px-2 py-1 rounded-full text-white text-xs ${
                  orientationPermissions.permissionStatus === 'granted' ? 'bg-green-500' :
                  orientationPermissions.permissionStatus === 'denied' ? 'bg-red-500' :
                  orientationPermissions.permissionStatus === 'requesting' ? 'bg-yellow-500' :
                  'bg-gray-500'
                }`}>
                  🧭 {orientationPermissions.permissionStatus}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      <Carousel 
        setApi={setCarouselApi} 
        opts={{ align: "start", loop: false }} 
        className="flex-grow flex flex-col pt-12 pb-20"
      >
        <CarouselContent className="h-full">
          <CarouselItem key="profile" className="h-full">
            <div className="flex flex-col items-center justify-start h-full p-4 text-center overflow-y-auto">
              <div className="flex flex-col items-center mb-6">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? 'User'} />
                  <AvatarFallback className="text-2xl">{user?.name?.charAt(0)?.toUpperCase() ?? 'U'}</AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-semibold mb-1">
                  {user?.name || (user?.email ? user.email.substring(0, 8) + '...' : 'Anonymous')}
                </h2>
                {user?.email && (
                  <p className="text-sm text-muted-foreground">
                    {user.email}
                  </p>
                )}
              </div>
              
              <div className="w-full max-w-2xl">
                <Tabs value={profileTab} onValueChange={setProfileTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="tournaments" className="flex items-center"><Trophy className="h-4 w-4 mr-2" />Tournaments</TabsTrigger>
                    <TabsTrigger value="club" className="flex items-center"><Crown className="h-4 w-4 mr-2" />Club</TabsTrigger>
                  </TabsList>
                  <TabsContent value="tournaments" className="pt-4">
                    {currentUserId && <UserProfileTournamentsTab userId={currentUserId} />}
                  </TabsContent>
                  <TabsContent value="club" className="pt-4">
                    <ClubTab />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </CarouselItem>
          <CarouselItem key="tournaments" className="h-full">
            <div className="flex flex-col items-center justify-start h-full p-4 text-center overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Trophy className="h-10 w-10 mr-3 text-purple-500" />
                  <h2 className="text-3xl font-semibold">Rating</h2>
                </div>
              </div>
              
              <div className="w-full max-w-2xl">
                <Tabs defaultValue="clubs" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="clubs" className="flex items-center"><Crown className="h-4 w-4 mr-2" />Clubs</TabsTrigger>
                    <TabsTrigger value="tournaments" className="flex items-center"><Trophy className="h-4 w-4 mr-2" />Tournaments</TabsTrigger>
                  </TabsList>
                  <TabsContent value="clubs" className="pt-4">
                    <Button 
                      variant="outline"
                      className="w-full mb-4 border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                      onClick={() => setIsCheckClubOpen(true)}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Создать клуб
                    </Button>
                    <ClubsList onNavigateToClubHall={navigateToClubHall} />
                  </TabsContent>
                  <TabsContent value="tournaments" className="pt-4">
                    <Button 
                      variant="outline"
                      className="w-full mb-4 border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                      onClick={() => setIsCreateTournamentModalOpen(true)}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Создать турнир
                    </Button>
                    {tournamentsLoading && <div className="flex items-center space-x-2"><LoaderCircle className="animate-spin h-5 w-5" /> <p>Loading tournaments...</p></div>}
                    {!tournamentsLoading && actualTournaments.length > 0 ? (
                <div className="w-full max-w-2xl space-y-1">
                  {actualTournaments.map((tournament) => {
                    const allGames = tournament.tournament_games || [];
                    const totalGames = allGames.length;
                    const finishedGames = allGames.filter(tg => 
                      tg.game && ['finished', 'checkmate', 'stalemate', 'draw', 'white_surrender', 'black_surrender'].includes(tg.game.status || '')
                    ).length;
                    const activeParticipants = (tournament.participants || []).filter(p => p.role === 1);
                    const participantCount = activeParticipants.length;
                    
                    return (
                      <div 
                        key={tournament.id} 
                        className="flex items-center justify-between p-3 hover:bg-muted/50 dark:hover:bg-muted/20 rounded-md cursor-pointer transition-colors border border-muted/20"
                        onClick={() => handleTournamentClick(tournament)}
                      >
                        <div className="flex flex-col flex-1 items-start pr-3 min-w-0">
                          <span className="text-sm font-medium text-foreground truncate">{tournament.type}</span>
                          <span className="text-xs text-muted-foreground truncate">ID: {tournament.id.substring(0, 8)}...</span>
                        </div>
                        <div className="flex flex-col flex-1 items-center flex-shrink-0 px-3 min-w-0">
                          <span className="text-xs text-muted-foreground">Games: <span className="text-green-600 font-medium">{finishedGames}</span>/{totalGames}</span>
                          <span className="text-xs text-muted-foreground">Players: <span className="font-medium">{participantCount}</span></span>
                        </div>
                        <div className="flex flex-col flex-1 items-end flex-shrink-0 space-y-1 min-w-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusBadgeClass(tournament.status)}`}>
                            {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
                          </span>
                          {tournament.created_at && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(tournament.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                    ) : (
                       !tournamentsLoading && <p>No tournaments found.</p>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </CarouselItem>
          <CarouselItem key="games" className="h-full">
            <div className="flex flex-col items-center justify-start h-full p-4 text-center overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Gamepad2 className="h-10 w-10 mr-3 text-purple-500" />
                  <h2 className="text-3xl font-semibold">Games</h2>
                </div>
              </div>
              
              <div className="w-full max-w-2xl">
                {currentUserId && <UserProfileGamesTab userId={currentUserId} />}
              </div>
            </div>
          </CarouselItem>
          <CarouselItem key="skins" className="h-full">
            {mainViewTab === 'skins' && (
              <Skins>
                <CheckClub 
                  isOpen={isCheckClubOpen || !clubsDataFormatted?.length} 
                  onClose={() => setIsCheckClubOpen(false)} 
                />
              </Skins>
            )}
          </CarouselItem>
        </CarouselContent>
      </Carousel>

      <div className={cn(
        "fixed inset-0 z-60 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center transition-transform duration-500 ease-in-out",
        selectedGameId ? "translate-y-0" : "translate-y-full"
      )}>
        {selectedGameId && (
          <>
            <Button 
              variant="outline" 
              size="icon" 
              className="absolute top-4 right-4 z-50 rounded-full"
              onClick={handleCloseGame}
            >
              <X/>
            </Button>
            <div className="w-full h-full flex items-center justify-center p-4">
              <Game 
                gameId={selectedGameId} 
                onClose={handleCloseGame}
                gameInvite={gameInvite}
                onJoinInvite={handleJoinGameFromInvite}
                isJoining={isCreatingGame}
              />
            </div>
          </>
        )}
      </div>

      {selectedTournament && (
        <Dialog open={isTournamentModalOpen} onOpenChange={setIsTournamentModalOpen}>
          <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>{selectedTournament.type}</DialogTitle>
              <DialogDescription>
                Status: {selectedTournament.status} {selectedTournament.created_at && `- Created: ${new Date(selectedTournament.created_at).toLocaleDateString()}`}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto py-4">
              <Tabs defaultValue="participants" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="participants" className="flex items-center"><Users className="h-4 w-4 mr-2" />Participants</TabsTrigger>
                  <TabsTrigger value="games" className="flex items-center"><ListChecks className="h-4 w-4 mr-2" />Games</TabsTrigger>
                  <TabsTrigger value="settings" className="flex items-center"><Crown className="h-4 w-4 mr-2" />Settings</TabsTrigger>
                </TabsList>
                <TabsContent value="participants" className="pt-4">
                  <TournamentParticipantsTab tournamentId={selectedTournament.id} />
                </TabsContent>
                <TabsContent value="games" className="pt-4">
                  <TournamentGamesTab tournamentId={selectedTournament.id} />
                </TabsContent>
                <TabsContent value="settings" className="pt-4">
                  <div className="space-y-6 p-1">
                    <div>
                      <Label className="text-sm font-medium">Tournament Type</Label>
                      <Select value={selectedTournament.type} disabled>
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {tournaments.map(type => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {/* <span className="text-xs text-muted-foreground">
                        {tournamentDescriptions[selectedTournament.type]}
                      </span> */}
                    </div>
                    
                    <Separator />

                    
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Tournament Status</Label>
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusBadgeClass(selectedTournament.status)}>
                          {selectedTournament.status.charAt(0).toUpperCase() + selectedTournament.status.slice(1)}
                        </Badge>
                        {selectedTournament.status === 'await' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={handleStartTournament}
                            disabled={isStartingTournament}
                            className="flex items-center"
                          >
                            {isStartingTournament ? (
                              <LoaderCircle className="animate-spin h-4 w-4 mr-2" />
                            ) : null}
                            Start Tournament
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <Label className="text-sm font-medium mb-3 block">AI Players</Label>
                      <div className="flex items-center space-x-3">
                        <Button 
                          onClick={handleAddAiPlayers}
                          disabled={isAddingAiPlayers}
                          size="sm"
                          className="flex items-center"
                        >
                          {isAddingAiPlayers ? (
                            <LoaderCircle className="animate-spin h-4 w-4 mr-2" />
                          ) : (
                            <PlusCircle className="h-4 w-4 mr-2" />
                          )}
                          Add AI Players
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          Adds 4 AI players to the tournament
                        </span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={isCreateTournamentModalOpen} onOpenChange={setIsCreateTournamentModalOpen}>
        <DialogContent className="max-w-[300px]">
          <DialogHeader>
            <DialogTitle>Create New Tournament</DialogTitle>
            <DialogDescription>
              Set up a new tournament with your preferred settings.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="tournament-type" className="text-sm font-medium">
                  Tournament Type
                </Label>
                <Select value={newTournamentType} onValueChange={setNewTournamentType}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Select tournament type" />
                  </SelectTrigger>
                  <SelectContent>
                    {tournaments.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">
                  {tournamentDescriptions[newTournamentType]}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              onClick={handleCreateTournament}
              disabled={isCreatingTournament}
              className="flex items-center"
            >
              {isCreatingTournament ? (
                <LoaderCircle className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <PlusCircle className="h-4 w-4 mr-2" />
              )}
              Create Tournament
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className={`absolute inset-0 w-full h-full transition-all duration-300 p-6 md:p-10 flex items-center justify-center ${profile
        ? `opacity-100 z-40 bg-background/80 backdrop-blur-sm`
        : `opacity-0 pointer-events-none` 
      }`} onClick={(event) => {
        if (event.currentTarget === event.target) {
          setProfile(false);
        }
      }}>
        <Card className={`max-w-md w-full h-auto max-h-[90vh] md:max-h-[80vh] p-3 shadow-xl/30 flex flex-col`}>
          <Tabs defaultValue="account" className="w-full h-full flex flex-col">
            <TabsList className="w-full">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>
            <div className="flex-1 overflow-y-auto p-1">
              <TabsContent value="account" className="h-full flex flex-col p-2">
                <div className="flex-grow space-y-4">
                  <p>User: {user?.name || 'N/A'}</p>
                  <p>Email: {user?.email || 'N/A'}</p>
                  <div>
                    <Label htmlFor="themeSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Тема</Label>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тему" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">Системная</SelectItem>
                        <SelectItem value="light">Светлая</SelectItem>
                        <SelectItem value="dark">Темная</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="boardStyleSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Стиль доски</Label>
                    <Select 
                      value={selectedBoardStyle} 
                      onValueChange={saveBoardStyleSetting}
                      disabled={isSavingBoardStyle}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите стиль доски" />
                      </SelectTrigger>
                      <SelectContent>
                        {BOARD_STYLES.map((style) => (
                          <SelectItem key={style.id} value={style.id}>
                            <div className="flex items-center space-x-2">
                              <div className="flex space-x-1">
                                <div 
                                  className="w-3 h-3 border border-gray-300 rounded-sm" 
                                  style={{ backgroundColor: style.lightColor }}
                                />
                                <div 
                                  className="w-3 h-3 border border-gray-300 rounded-sm" 
                                  style={{ backgroundColor: style.darkColor }}
                                />
                              </div>
                              <div>
                                <div className="font-medium">{style.name}</div>
                                <div className="text-xs text-gray-500">{style.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isSavingBoardStyle && (
                      <div className="flex items-center mt-2 text-sm text-gray-600">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Сохранение...
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-auto pt-4">
                  <Button variant="outline"
                    className="w-full"
                    onClick={() => signOut({ callbackUrl: '/' })} disabled={isLoadingSession}
                    >
                    <LogOut className="mr-2 h-4 w-4" /> Sign Out
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="payment" className="p-2">Payment Settings Placeholder</TabsContent>
              <TabsContent value="notifications" className="p-2">Notifications Settings Placeholder</TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>

      <div className={cn(
        "p-2 sticky bottom-0 left-0 right-0 z-30 bg-transparent transition-transform duration-300 ease-in-out",
        selectedGameId ? "translate-y-full" : "translate-y-0"
      )}>
        <div className="w-full h-16 bg-purple-900/90 backdrop-blur-md rounded-lg flex items-center justify-between shadow-lg px-1">
          <div className="flex-1 flex justify-end items-center">
            <Button variant="ghost" className="text-white flex flex-col items-center justify-center h-full px-2" onClick={() => setMainViewTab("profile")}>
              <User className="h-5 w-5 mb-0.5" />
              <span className="text-xs leading-tight">Profile</span>
            </Button>
            <Button variant="ghost" className="flex-grow-0 text-white flex flex-col items-center justify-center h-full px-2" onClick={() => setMainViewTab("tournaments")}>
              <Trophy className="h-5 w-5 mb-0.5" />
              <span className="text-xs leading-tight">Rating</span>
            </Button>
            {/* <Button variant="ghost" className="text-white/70 flex flex-col items-center justify-center h-full px-2 cursor-not-allowed opacity-50">
              <Globe className="h-5 w-5 mb-0.5" />
              <span className="text-xs leading-tight">Rating</span>
            </Button> */}
          </div>

          <div className={`flex-shrink-0 bg-transparent border-none relative`} onClick={() => setProfile(!profile)}>
            <Avatar className={`relative z-50 transition-all duration-300 size-16 md:size-20 transform ${profile ? "scale-125 -translate-y-5 border-4 border-purple-400" : "scale-100 -translate-y-3 border-2 border-purple-700"} shadow-lg`}>
              {!!user?.image && <AvatarImage src={user.image} />}
              <AvatarFallback className="text-lg">{user?.name ? user.name.charAt(0).toUpperCase() : '?'}</AvatarFallback>
              {isLoadingSession && <LoaderCircle className="animate-spin absolute top-0 left-0 w-full h-full text-white"/>}
            </Avatar>
          </div>
          
          <div className="flex-1 flex justify-start items-center space-x-1">
            <Button variant="ghost" className="text-white flex flex-col items-center justify-center h-full px-2" onClick={() => setMainViewTab("skins")}>
              <Shirt className="h-5 w-5 mb-0.5" />
              <span className="text-xs leading-tight">Skins</span>
            </Button>
            {/* <Button variant="ghost" className="text-white/70 flex flex-col items-center justify-center h-full px-2 cursor-not-allowed opacity-50">
              <Sparkles className="h-5 w-5 mb-0.5" />
              <span className="text-xs leading-tight">Perks</span>
            </Button> */}
            <Button variant="ghost" className="text-white flex flex-col items-center justify-center h-full px-2" onClick={() => setMainViewTab("games")}>
              <Gamepad2 className="h-5 w-5 mb-0.5" />
              <span className="text-xs leading-tight">Games</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white flex flex-col items-center justify-center h-12 w-12 aspect-square"
              onClick={handleCreateGame}
              disabled={isCreatingGame}
            >
              {isCreatingGame ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="h-4 w-4" />
              )}
              <span className="text-xs">{isCreatingGame ? "Creating..." : "Create"}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>

    {/* Check for available items to accept */}
    <CheckAvailableItems />

    {/* Show manual request button if needed */}
    {((motionPermissions.needsUserInteraction && motionPermissions.permissionStatus !== 'granted') || 
      (orientationPermissions.needsUserInteraction && orientationPermissions.permissionStatus !== 'granted')) && (
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Allow Device Access</DialogTitle>
            </DialogHeader>
            <button 
              onClick={async () => {
                if (motionPermissions.needsUserInteraction && motionPermissions.permissionStatus !== 'granted') {
                  await motionPermissions.requestPermission();
                }
                if (orientationPermissions.needsUserInteraction && orientationPermissions.permissionStatus !== 'granted') {
                  await orientationPermissions.requestPermission();
                }
              }}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-full transition-colors"
            >
              📱 Allow Device Access
            </button>
          </DialogContent>
        </Dialog>
    )}
  </>);
}

