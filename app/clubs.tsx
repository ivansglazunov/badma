"use client";

import React, { useState } from 'react';
import { useSubscription, useHasyx } from 'hasyx';
import { Button } from 'hasyx/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from 'hasyx/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from 'hasyx/components/ui/avatar';
import { LoaderCircle, PlusCircle, Trophy, Sword, UserPlus, Crown } from 'lucide-react';
import { HoverCard } from '@/components/hover-card';
import { useClubStore } from '@/lib/stores/club-store';
import { useToastHandleClubsError } from '@/hooks/toasts';

interface Club {
  id: string;
  title: string;
  created_at: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
}

interface ClubsListProps {
  onNavigateToClubHall?: () => void;
}

export function ClubsList({ onNavigateToClubHall }: ClubsListProps) {
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isJoiningClub, setIsJoiningClub] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);

  // Get user clubs from Zustand
  const { getUserClubById } = useClubStore();
  const hasyx = useHasyx();

  // Get all clubs
  const { data: clubsData, loading: clubsLoading, error: clubsError } = useSubscription(
    {
      table: 'badma_clubs',
      returning: [
        'id',
        'title',
        'created_at',
        {
          user: ['id', 'name', 'image']
        }
      ],
      order_by: { created_at: 'desc' }
    }
  );

  const clubs: Club[] = React.useMemo(() => {
    if (Array.isArray(clubsData)) return clubsData as Club[];
    if (clubsData && (clubsData as any).badma_clubs) return (clubsData as any).badma_clubs as Club[];
    return [];
  }, [clubsData]);

  // Обрабатываем ошибки через тост
  useToastHandleClubsError(clubsError);

  const handleClubClick = (club: Club) => {
    setSelectedClub(club);
    setIsDialogOpen(true);
  };

  const handleJoinClub = async () => {
    if (!selectedClub) return;
    
    setIsJoiningClub(true);
    try {
      // Здесь будет логика отправки вызова клубу
      console.log('Challenging club:', selectedClub.id);
      // await hasyx.insert({ 
      //   table: 'badma_challenges', 
      //   object: { club_id: selectedClub.id, user_id: hasyx.userId } 
      // });
    } catch (error) {
      console.error('Error challenging club:', error);
    } finally {
      setIsJoiningClub(false);
      setIsDialogOpen(false);
    }
  };

  const handleApplicationClick = () => {
    setIsDialogOpen(false);
    setIsConfirmDialogOpen(true);
  };

  const handleSubmitApplication = async () => {
    if (!selectedClub || !hasyx.userId) return;
    
    setIsSubmittingApplication(true);
    try {
      await hasyx.insert({
        table: 'badma_in_clubs',
        object: {
          club_id: selectedClub.id,
          user_id: hasyx.userId,
          created_by_id: hasyx.userId,
          status: 'request'
        }
      });
      console.log('Application submitted successfully');
    } catch (error) {
      console.error('Error submitting application:', error);
    } finally {
      setIsSubmittingApplication(false);
      setIsConfirmDialogOpen(false);
    }
  };

  if (clubsLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <LoaderCircle className="animate-spin h-6 w-6 text-purple-500 mr-2" />
        Loading clubs...
      </div>
    );
  }

  if (!clubs.length) {
    return (
      <p className="p-4 text-muted-foreground">No clubs found.</p>
    );
  }

  return (
    <>
      <div className="space-y-2 p-1">
        {clubs.map((club) => (
          <div 
            key={club.id} 
            className="flex items-center justify-between p-3 hover:bg-muted/30 rounded-md cursor-pointer border border-muted/20"
            onClick={() => handleClubClick(club)}
          >
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={club.user?.image ?? undefined} alt={club.user?.name ?? 'Club'} />
                <AvatarFallback>{club.user?.name?.charAt(0)?.toUpperCase() ?? 'C'}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{club.title || 'Untitled Club'}</span>
                <span className="text-xs text-muted-foreground">
                  Created by {club.user?.name ?? 'Unknown'} • {club.created_at && new Date(club.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </div>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTitle></DialogTitle>
        <DialogContent className="p-0 border-0 bg-transparent max-w-none w-auto">
          <HoverCard
            force={1.3}
            maxRotation={25}
            maxLift={50}
            useDeviceOrientation={false}
          >
            <div className="w-[300px] h-[400px] bg-background border-2 border-purple-500 rounded-lg shadow-xl flex flex-col items-center justify-center p-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-6 text-foreground">
                  {selectedClub?.title || 'Untitled Club'}
                </h2>
                {(() => {
                  const userClub = selectedClub ? getUserClubById(selectedClub.id) : null;
                  const isUserClub = userClub && userClub.id === selectedClub?.id;
                  
                  if (isUserClub) {
                    return (
                      <div className="flex flex-col items-center space-y-3">
                        <div className="text-6xl mb-2">🎉</div>
                        <span className="text-lg font-semibold text-purple-600">
                          Это наш клуб!
                        </span>
                        <Button 
                          className="h-[60px] w-[200px] bg-purple-600 hover:bg-purple-700 text-white flex flex-col items-center justify-center shadow-xl mt-4"
                          onClick={() => {
                            setIsDialogOpen(false);
                            onNavigateToClubHall?.();
                          }}
                        >
                          <Crown className="h-5 w-5 mb-1" />
                          <span className="text-sm font-medium">
                            Перейти в клуб-холл
                          </span>
                        </Button>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="flex flex-col space-y-3">
                      <Button 
                        className="h-[80px] w-[200px] bg-purple-600 hover:bg-purple-700 text-white flex flex-col items-center justify-center shadow-xl"
                        disabled={isJoiningClub}
                        onClick={handleJoinClub}
                      >
                        {isJoiningClub ? (
                          <LoaderCircle className="animate-spin h-5 w-5 mb-1" />
                        ) : (
                          <Sword className="h-5 w-5 mb-1" />
                        )}
                        <span className="text-sm font-medium">
                          {isJoiningClub ? 'Отправка...' : 'Бросить вызов'}
                        </span>
                      </Button>
                      <Button 
                        variant="outline"
                        className="h-[60px] w-[200px] border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 flex flex-col items-center justify-center"
                        onClick={handleApplicationClick}
                      >
                        <UserPlus className="h-4 w-4 mb-1" />
                        <span className="text-xs">Подать заявку</span>
                      </Button>
                    </div>
                  );
                })()}
              </div>
            </div>
          </HoverCard>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogTitle></DialogTitle>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Подать заявку на вступление в клуб?</DialogTitle>
            <DialogDescription>
              Если заявку примут - вы покинете клуб в котором находитесь.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsConfirmDialogOpen(false)}
              disabled={isSubmittingApplication}
            >
              Отмена
            </Button>
            <Button 
              onClick={handleSubmitApplication}
              disabled={isSubmittingApplication}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmittingApplication ? (
                <>
                  <LoaderCircle className="animate-spin h-4 w-4 mr-2" />
                  Отправка...
                </>
              ) : (
                'Подать заявку'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 