"use client";

import { LogOut, LoaderCircle, Crown, Joystick, X, Trophy, Gamepad2, PlusCircle, Users, ListChecks, Shirt, Sparkles, Globe } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import React, { useState, useEffect, useRef } from "react";

import { useClient, useSubscription } from "hasyx";
import { Avatar, AvatarFallback, AvatarImage } from "hasyx/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "hasyx/components/ui/tabs";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "hasyx/components/ui/carousel";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "hasyx/components/ui/dialog";

import Board from "@/lib/board";
import { OAuthButtons } from "hasyx/components/auth/oauth-buttons";
import { useTheme } from "hasyx/components/theme-switcher";
import { Button } from "hasyx/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "hasyx/components/ui/card";
import { Input } from "hasyx/components/ui/input";

import { cn } from "hasyx/lib/utils"
import { useMounted } from "@/hooks/mounted";

interface TournamentType {
  id: string;
  status: 'await' | 'ready' | 'continue' | 'finished';
  type: string;
  created_at: string;
  tournament_games?: Array<{
    id: string;
    game: {
      id: string;
      status?: string | null;
    };
  }>;
  participants?: Array<{
    id: string;
    user_id: string;
    role: number;
  }>;
}

interface UserType {
  id: string;
  name?: string | null;
  image?: string | null;
  tournament_scores?: Array<{
    score: number;
  }>;
  scores?: Array<{
    id: string;
    score: number;
  }>;
  games_via_joins?: Array<{
    id: string;
    status?: string | null;
    moves?: Array<{
      id: string;
    }>;
  }>;
}

interface GameType {
  id: string;
  status?: string | null;
  moves?: Array<{
    id: string;
  }>;
}

interface TournamentGameType {
  id: string;
  game: GameType;
}

const getStatusBadgeClass = (status: TournamentType['status']): string => {
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
          scores: ['id', 'score']
        }
      ]
    },
    { skip: !tournamentId }
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

  if (loading) return <div className="flex items-center justify-center p-4"><LoaderCircle className="animate-spin h-6 w-6 text-purple-500 mr-2" /> Loading participants...</div>;
  if (error) return <p className="p-4 text-red-500">Error loading participants: {error.message}. Ensure the relationship is correctly set up.</p>;
  if (!participants.length) return <p className="p-4 text-muted-foreground">No active participants found for this tournament.</p>;

  return (
    <div className="space-y-4 p-1">
      {participants.map((participant: any) => {
        const totalScore = (participant.scores || []).reduce((sum: number, score: any) => sum + (score.score || 0), 0);
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
                  <div key={game.id} className="flex items-center justify-between text-xs bg-muted/30 rounded px-2 py-1">
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
 const games: TournamentGameType[] = React.useMemo(() => {
    if (Array.isArray(data)) return data as TournamentGameType[];
    if (data && (data as any).badma_tournament_games) return (data as any).badma_tournament_games as TournamentGameType[];
    return [];
  }, [data]);

  if (loading) return <div className="flex items-center justify-center p-4"><LoaderCircle className="animate-spin h-6 w-6 text-purple-500 mr-2" /> Loading games...</div>;
  if (error) return <p className="p-4 text-red-500">Error loading games: {error.message}</p>;
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
  const client = useClient();
  const { theme, setTheme } = useTheme();

  const [carouselApi, setCarouselApi] = useState<CarouselApi | undefined>();
  const viewOrder = React.useMemo(() => ['tournaments', 'games', 'create'], []);
  const [mainViewTab, setMainViewTab] = useState(viewOrder[1]);
  const [profile, setProfile] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<TournamentType | null>(null);
  const [isTournamentModalOpen, setIsTournamentModalOpen] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  
  const isAuthenticated = sessionStatus === "authenticated";
  const isLoadingSession = sessionStatus === "loading";

  const handleOpenGame = (gameId: string) => {
    setSelectedGameId(gameId);
    if (isTournamentModalOpen) setIsTournamentModalOpen(false);
    if (profile) setProfile(false);
  };
  
  useEffect(() => {
    handleOpenGameGlobal = handleOpenGame;
  }, [isTournamentModalOpen, profile, handleOpenGame]);

  const handleCloseGame = () => {
    setSelectedGameId(null);
  };

  const handleTournamentClick = (tournament: TournamentType) => {
    setSelectedTournament(tournament);
    setIsTournamentModalOpen(true);
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

  const actualTournaments: TournamentType[] = React.useMemo(() => {
    if (Array.isArray(tournamentsData)) {
      return tournamentsData as TournamentType[];
    }
    if (tournamentsData && (tournamentsData as any).badma_tournaments) {
       return (tournamentsData as any).badma_tournaments as TournamentType[];
    }
    if (tournamentsData && (tournamentsData as any).tournaments) {
       return (tournamentsData as any).tournaments as TournamentType[];
    }
    return [];
  }, [tournamentsData]);

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
    <div className="flex flex-1 flex-col bg-background relative h-screen max-h-screen overflow-hidden">
      <div className="absolute top-3 right-3 z-50">
      </div>
      
      <Carousel 
        setApi={setCarouselApi} 
        opts={{ align: "start", loop: false }} 
        className="flex-grow flex flex-col pt-12 pb-20"
      >
        <CarouselContent className="h-full">
          <CarouselItem key="tournaments" className="h-full">
            <div className="flex flex-col items-center justify-start h-full p-4 text-center overflow-y-auto">
              <div className="flex items-center mb-6">
                <Trophy className="h-10 w-10 mr-3 text-purple-500" />
                <h2 className="text-3xl font-semibold">Tournaments</h2>
              </div>
              {tournamentsLoading && <div className="flex items-center space-x-2"><LoaderCircle className="animate-spin h-5 w-5" /> <p>Loading tournaments...</p></div>}
              {tournamentsError && (
                <p className="text-red-500">
                  Error loading tournaments: {(tournamentsError as any)?.message || "Unknown error"}
                </p>
              )}
              {!tournamentsLoading && !tournamentsError && actualTournaments.length > 0 ? (
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
                        <div className="flex flex-col flex-1 pr-2">
                          <span className="text-sm font-medium text-foreground truncate">{tournament.type}</span>
                          <span className="text-xs text-muted-foreground">ID: {tournament.id.substring(0, 8)}...</span>
                          <div className="flex items-center space-x-3 text-xs text-muted-foreground mt-1">
                            <span>
                              Games: <span className="text-green-600 font-medium">{finishedGames}</span>/{totalGames}
                            </span>
                            <span>
                              Players: <span className="font-medium">{participantCount}</span>
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
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
                 !tournamentsLoading && !tournamentsError && <p>No tournaments found.</p>
              )}
            </div>
          </CarouselItem>
          <CarouselItem key="games" className="h-full">
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <Gamepad2 className="h-16 w-16 mb-4 text-purple-500" />
              <h2 className="text-2xl font-semibold mb-2">Play a Game</h2>
              <p className="text-muted-foreground mb-4">Start a new game or continue an existing one.</p>
              <Button onClick={() => handleOpenGame("default_free_game_id")}>Start Free Play</Button>
            </div>
          </CarouselItem>
          <CarouselItem key="create" className="h-full">
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <PlusCircle className="h-16 w-16 mb-4 text-purple-500" />
              <h2 className="text-2xl font-semibold mb-2">Create New Game</h2>
              <p className="text-muted-foreground">Game creation form will be here.</p>
            </div>
          </CarouselItem>
        </CarouselContent>
      </Carousel>

      <div className={cn(
        "fixed inset-0 z-35 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center transition-transform duration-500 ease-in-out",
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
              <GameFree /> 
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
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="participants" className="flex items-center"><Users className="h-4 w-4 mr-2" />Participants</TabsTrigger>
                  <TabsTrigger value="games" className="flex items-center"><ListChecks className="h-4 w-4 mr-2" />Games</TabsTrigger>
                </TabsList>
                <TabsContent value="participants" className="pt-4">
                  <TournamentParticipantsTab tournamentId={selectedTournament.id} />
                </TabsContent>
                <TabsContent value="games" className="pt-4">
                  <TournamentGamesTab tournamentId={selectedTournament.id} />
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
                    <label htmlFor="themeChanger" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Theme</label>
                    <Input id="themeChanger" value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="Type 'dark' or 'light'" />
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
          <div className="flex-1 flex justify-start items-center space-x-1">
            <Button variant="ghost" className="flex-grow-0 text-white flex flex-col items-center justify-center h-full px-2" onClick={() => setMainViewTab("tournaments")}>
              <Trophy className="h-5 w-5 mb-0.5" />
              <span className="text-xs leading-tight">Tournaments</span>
            </Button>
            <Button variant="ghost" className="text-white/70 flex flex-col items-center justify-center h-full px-2 cursor-not-allowed opacity-50">
              <Globe className="h-5 w-5 mb-0.5" />
              <span className="text-xs leading-tight">Rating</span>
            </Button>
          </div>

          <div className={`flex-shrink-0 bg-transparent border-none relative`} onClick={() => setProfile(!profile)}>
            <Avatar className={`relative z-50 transition-all duration-300 size-16 md:size-20 transform ${profile ? "scale-125 -translate-y-5 border-4 border-purple-400" : "scale-100 -translate-y-3 border-2 border-purple-700"} shadow-lg`}>
              {!!user?.image && <AvatarImage src={user.image} />}
              <AvatarFallback className="text-lg">{user?.name ? user.name.charAt(0).toUpperCase() : '?'}</AvatarFallback>
              {isLoadingSession && <LoaderCircle className="animate-spin absolute top-0 left-0 w-full h-full text-white"/>}
            </Avatar>
          </div>
          
          <div className="flex-1 flex justify-end items-center space-x-1">
            <Button variant="ghost" className="text-white/70 flex flex-col items-center justify-center h-full px-2 cursor-not-allowed opacity-50">
              <Shirt className="h-5 w-5 mb-0.5" />
              <span className="text-xs leading-tight">Skins</span>
            </Button>
            <Button variant="ghost" className="text-white/70 flex flex-col items-center justify-center h-full px-2 cursor-not-allowed opacity-50">
              <Sparkles className="h-5 w-5 mb-0.5" />
              <span className="text-xs leading-tight">Perks</span>
            </Button>
            <Button variant="ghost" className="text-white flex flex-col items-center justify-center h-full px-2" onClick={() => setMainViewTab("games")}>
              <Gamepad2 className="h-5 w-5 mb-0.5" />
              <span className="text-xs leading-tight">Games</span>
            </Button>
            <Button variant="ghost" size="icon" className="text-white flex flex-col items-center justify-center h-12 w-12 aspect-square" onClick={() => setMainViewTab("create")}>
              <PlusCircle className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  </>);
}