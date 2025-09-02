"use client";

import React, { useState } from 'react';
import { useSession } from "next-auth/react";
import { useHasyx } from "hasyx";
import { Button } from "hasyx/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "hasyx/components/ui/dialog";
import { Input } from "hasyx/components/ui/input";
import { LoaderCircle, PlusCircle } from "lucide-react";
import { HoverCard } from "@/components/hover-card";
import { useClubStore } from "@/lib/stores/club-store";
import { CreateClubDialog } from "./create-club-dialog";
import { useTranslations } from 'hasyx';

interface CheckClubProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CheckClub({ isOpen, onClose }: CheckClubProps) {
  const t = useTranslations();
  
  const { data: session } = useSession();
  const hasyx = useHasyx();
  const { userClubs, isLoading: clubsLoading } = useClubStore();
  const [isDialogOpen, setIsDialogOpen] = useState(isOpen);
  const [isCreateClubDialogOpen, setIsCreateClubDialogOpen] = useState(false);

  const handleShowCreateClubDialog = () => {
    setIsCreateClubDialogOpen(true);
  };

  // Sync dialog state with props
  React.useEffect(() => {
    setIsDialogOpen(isOpen);
  }, [isOpen]);

  // Debug create club dialog state
  React.useEffect(() => {
    console.log('isCreateClubDialogOpen changed:', isCreateClubDialogOpen);
  }, [isCreateClubDialogOpen]);

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      onClose();
    }
  };

  return (
    <>
    <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
      <DialogTitle></DialogTitle>
      <DialogContent className="p-0 border-0 bg-transparent max-w-none w-auto">
        <div className="flex items-center justify-center">
          {/* <HoverCard
            force={1.3}
            maxRotation={25}
            maxLift={50}
            useDeviceOrientation={true}
            orientationSensitivity={0.8}
          > */}
            <div className="w-[300px] h-[500px] bg-purple-600 rounded-lg shadow-xl flex items-center justify-center pointer-events-none">
              <div className="text-white text-center pointer-events-auto">
                <div className="space-y-2 text-xs opacity-60">
                  <h1 style={{ fontSize: '4rem' }}>🫶</h1>
                  <p className="text-xl">{t('badma.app.omManiBadmaChess')}</p>
                  <p>{t('badma.app.needToJoinClub')}</p>
                  <div className="flex flex-row items-center justify-center gap-4">
                    <Button className="h-[120px] w-[120px] bg-white flex flex-col items-center justify-center shadow-xl opacity-20" disabled>
                      <span className="text-2xl mb-1">🤝</span>
                      <span className="text-xs">{t('badma.app.joinClub')}</span>
                    </Button>
                    <Button 
                      className="h-[120px] w-[120px] bg-white flex flex-col items-center justify-center shadow-xl"
                      disabled={clubsLoading}
                      onClick={() => {
                        console.log('Create club button clicked!');
                        handleShowCreateClubDialog();
                      }}
                    >
                      {clubsLoading ? (
                        <LoaderCircle className="animate-spin h-6 w-6 mb-1" />
                      ) : (
                        <span className="text-2xl mb-1">➕</span>
                      )}
                      <span className="text-xs">{clubsLoading ? t('badma.app.loading') : t('badma.app.createClub')}</span>
                    </Button>
                  </div>
                  
                  {/* Clubs Diagnostic Data */}
                  {/* <div className="mt-4 p-2 bg-black/20 rounded text-left text-xs">
                    <p className="font-bold mb-1">Clubs Diagnostic:</p>
                    <p>Loading: {clubsLoading ? 'true' : 'false'}</p>
                    <div className="mt-2 max-h-32 overflow-y-auto">
                      <pre className="text-xs whitespace-pre-wrap">
                        {JSON.stringify(userClubs, null, 2)}
                      </pre>
                    </div>
                  </div> */}
                </div>
              </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Create Club Dialog */}
    <CreateClubDialog 
      isOpen={isCreateClubDialogOpen}
      onClose={() => {
        setIsCreateClubDialogOpen(false);
        setIsDialogOpen(false);
        onClose();
      }}
    />
    </>
  );
} 