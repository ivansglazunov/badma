"use client";

import React, { useState } from 'react';
import { useHasyx } from "hasyx";
import { Button } from "hasyx/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "hasyx/components/ui/dialog";
import { Input } from "hasyx/components/ui/input";
import { LoaderCircle } from "lucide-react";

interface CreateClubDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateClubDialog({ isOpen, onClose, onSuccess }: CreateClubDialogProps) {
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
      await hasyx.insert({ 
        table: 'badma_clubs', 
        object: { 
          user_id: hasyx.userId,
          title: clubName.trim()
        } 
      });
      
      console.log('✅ [CREATE_CLUB] Club created successfully');
      
      // Reset form
      setClubName('');
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Close dialog
      onClose();
    } catch (error) {
      console.error('❌ [CREATE_CLUB] Error creating club:', error);
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
            <h3 className="text-lg font-semibold">Создать новый клуб</h3>
            <p className="text-sm text-gray-600">
              Введите название для вашего клуба
            </p>
          </div>
          
          <div className="space-y-2">
            <Input
              placeholder="Название клуба"
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
              Отмена
            </Button>
            <Button
              onClick={handleCreateClub}
              disabled={isCreatingClub || !clubName.trim()}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              {isCreatingClub ? (
                <>
                  <LoaderCircle className="animate-spin h-4 w-4 mr-2" />
                  Создание...
                </>
              ) : (
                'Создать'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
