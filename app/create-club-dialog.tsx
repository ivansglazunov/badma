"use client";

import React, { useState } from 'react';
import { useHasyx } from "hasyx";
import { useTranslations } from 'hasyx';
import { Button } from "hasyx/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "hasyx/components/ui/dialog";
import { Input } from "hasyx/components/ui/input";
import { LoaderCircle } from "lucide-react";

interface CreateClubDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  kind?: 'club' | 'school';
}

export function CreateClubDialog({ isOpen, onClose, onSuccess, kind = 'club' }: CreateClubDialogProps) {
  const t = useTranslations();
  const hasyx = useHasyx();
  const [isCreatingClub, setIsCreatingClub] = useState(false);
  const [clubName, setClubName] = useState('');

  const handleCreateClub = async () => {
    if (!hasyx.userId) {
      console.error('No user ID available');
      return;
    }
    
    if (!clubName.trim()) {
      console.error('Club name is required');
      return;
    }
    
    setIsCreatingClub(true);
    try {
      // 1) Create group with provided kind (owner inferred by trigger)
      const created = await hasyx.insert({ 
        table: 'groups', 
        object: { 
          title: clubName.trim(),
          kind
        } 
      });
      const createdGroup = Array.isArray(created) ? created[0] : (created as any)?.insert_groups_one || (created as any)?.groups?.[0] || created;
      if (!createdGroup?.id) throw new Error('Group was not created');
      
      console.log('✅ [CREATE_GROUP] Group created successfully');
      
      // Reset form
      setClubName('');
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Close dialog
      onClose();
    } catch (error) {
      console.error('❌ [CREATE_GROUP] Error creating group:', error);
    } finally {
      setIsCreatingClub(false);
    }
  };

  const handleCancel = () => {
    setClubName('');
    onClose();
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      handleCancel();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogTitle></DialogTitle>
      <DialogContent className="max-w-sm">
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{kind === 'club' ? t('badma.app.createNewClub') : t('badma.app.createNewSchool')}</h3>
            <p className="text-sm text-gray-600">
              {kind === 'club' ? t('badma.app.enterClubName') : t('badma.app.enterSchoolName')}
            </p>
          </div>
          
          <div className="space-y-2">
            <Input
              placeholder={kind === 'club' ? t('badma.app.clubNamePlaceholder') : t('badma.app.schoolNamePlaceholder')}
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              disabled={isCreatingClub}
              className="w-full"
              maxLength={50}
            />
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isCreatingClub}
            >
              {t('badma.app.cancel')}
            </Button>
            <Button
              onClick={handleCreateClub}
              disabled={isCreatingClub || !clubName.trim()}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              {isCreatingClub ? (
                <>
                  <LoaderCircle className="animate-spin h-4 w-4 mr-2" />
                  {t('badma.app.creating')}
                </>
              ) : (
                t('badma.app.create')
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
