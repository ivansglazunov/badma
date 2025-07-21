import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useHasyx, useSubscription } from 'hasyx';
import { Avatar, AvatarFallback, AvatarImage } from 'hasyx/components/ui/avatar';
import { Input } from 'hasyx/components/ui/input';
import { Button } from 'hasyx/components/ui/button';
import { LoaderCircle, Crown, Check, X, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from 'hasyx/components/ui/dialog';

export const ClubTab: React.FC = () => {
  const { data: session } = useSession();
  const hasyx = useHasyx();
  
  // State for club title editing
  const [titleValue, setTitleValue] = useState('');
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  
  // State for member management
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isRemovalDialogOpen, setIsRemovalDialogOpen] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isProcessingMember, setIsProcessingMember] = useState(false);

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

  // Format clubs data
  const clubsDataFormatted = React.useMemo(() => {
    if (!clubsData) return null;
    
    if (Array.isArray(clubsData)) {
      return clubsData;
    }
    if (clubsData && (clubsData as any).badma_clubs) {
      return (clubsData as any).badma_clubs;
    }
    return clubsData;
  }, [clubsData]);

  // Get the first club (assuming user is in one club)
  const currentClub = clubsDataFormatted?.[0];

  // Sync title value with database data
  useEffect(() => {
    if (currentClub?.title !== undefined) {
      setTitleValue(currentClub.title);
    }
  }, [currentClub?.title]);

  // Check if title has been modified
  const isTitleModified = titleValue !== (currentClub?.title || '');

  // Function to save club title
  const handleSaveTitle = async () => {
    if (!currentClub || !isTitleModified) return;
    
    setIsSavingTitle(true);
    try {
      await hasyx.update({
        table: 'badma_clubs',
        where: { id: { _eq: currentClub.id } },
        _set: { 
          title: titleValue,
          updated_at: Date.now()
        }
      });
    } catch (error) {
      console.error('Error saving club title:', error);
    } finally {
      setIsSavingTitle(false);
    }
  };

  // Function to reject member application
  const handleRejectMember = async (member: any) => {
    if (!member) return;
    
    setIsProcessingMember(true);
    try {
      await hasyx.update({
        table: 'badma_in_clubs',
        where: { id: { _eq: member.id } },
        _set: { 
          status: 'denied',
          updated_at: Date.now()
        }
      });
      console.log('Member application rejected');
    } catch (error) {
      console.error('Error rejecting member:', error);
    } finally {
      setIsProcessingMember(false);
    }
  };

  // Function to show approval confirmation
  const handleShowApprovalConfirmation = (member: any) => {
    setSelectedMember(member);
    setIsConfirmDialogOpen(true);
  };

  // Function to approve member application
  const handleApproveMember = async () => {
    if (!selectedMember) return;
    
    setIsProcessingMember(true);
    try {
      await hasyx.update({
        table: 'badma_in_clubs',
        where: { id: { _eq: selectedMember.id } },
        _set: { 
          status: 'approved',
          updated_at: Date.now()
        }
      });
      console.log('Member application approved');
    } catch (error) {
      console.error('Error approving member:', error);
    } finally {
      setIsProcessingMember(false);
      setIsConfirmDialogOpen(false);
      setSelectedMember(null);
    }
  };

  // Function to show removal confirmation
  const handleShowRemovalConfirmation = (member: any) => {
    setSelectedMember(member);
    setIsRemovalDialogOpen(true);
  };

  // Function to remove member from club
  const handleRemoveMember = async () => {
    if (!selectedMember) return;
    
    setIsProcessingMember(true);
    try {
      await hasyx.delete({
        table: 'badma_in_clubs',
        where: { id: { _eq: selectedMember.id } }
      });
      console.log('Member removed from club');
    } catch (error) {
      console.error('Error removing member:', error);
    } finally {
      setIsProcessingMember(false);
      setIsRemovalDialogOpen(false);
      setSelectedMember(null);
    }
  };

  // Function to show leave club confirmation
  const handleShowLeaveConfirmation = () => {
    setIsLeaveDialogOpen(true);
  };

  // Function to leave club
  const handleLeaveClub = async () => {
    if (!currentClub || !hasyx.userId) return;
    
    setIsProcessingMember(true);
    try {
      if (currentClub.user_id === hasyx.userId) {
        // If user is club owner, remove user_id from club (make club ownerless)
        await hasyx.update({
          table: 'badma_clubs',
          where: { id: { _eq: currentClub.id } },
          _set: { 
            user_id: null,
            updated_at: Date.now()
          }
        });
        console.log('Left club as owner - club is now ownerless');
      } else {
        // If user is regular member, delete their membership record
        const userMembership = members.find(m => m.user_id === hasyx.userId);
        if (userMembership) {
          await hasyx.delete({
            table: 'badma_in_clubs',
            where: { id: { _eq: userMembership.id } }
          });
          console.log('Left club as member');
        }
      }
    } catch (error) {
      console.error('Error leaving club:', error);
    } finally {
      setIsProcessingMember(false);
      setIsLeaveDialogOpen(false);
    }
  };

  if (clubsLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <LoaderCircle className="animate-spin h-6 w-6 text-purple-500 mr-2" />
        Loading club data...
      </div>
    );
  }

  if (clubsError) {
    return (
      <div className="p-4 text-red-500">
        Error loading club data: {clubsError.message}
      </div>
    );
  }

  if (!currentClub) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>You are not a member of any club yet.</p>
        <p className="text-sm mt-2">Join or create a club to see club information here.</p>
      </div>
    );
  }

  const owner = currentClub.user;
  const members = currentClub.in_clubs || [];
  const isOwner = owner?.id === hasyx.userId;

  return (
    <div className="space-y-4 p-1">
      {/* Club Title */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Club Title</h3>
        <div className="flex items-center space-x-2">
          <Input
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            placeholder="Enter club title..."
            disabled={isSavingTitle}
            className="flex-1"
          />
          {isTitleModified && (
            <Button
              onClick={handleSaveTitle}
              disabled={isSavingTitle}
              size="sm"
              className="flex items-center"
            >
              {isSavingTitle ? (
                <LoaderCircle className="animate-spin h-4 w-4" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Club Owner */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Club Owner</h3>
        <div className={`flex items-center space-x-3 p-3 rounded-md border-2 ${isOwner ? 'border-yellow-400 bg-yellow-50/20' : 'border-muted/20'}`}>
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarImage src={owner?.image ?? undefined} alt={owner?.name ?? 'Owner'} />
              <AvatarFallback>{owner?.name?.charAt(0)?.toUpperCase() ?? 'O'}</AvatarFallback>
            </Avatar>
            <Crown className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500 fill-yellow-500" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium text-foreground">{owner?.name ?? 'Unknown Owner'}</span>
            <div className="text-xs text-muted-foreground">
              Club ID: {currentClub.id.substring(0, 8)}...
            </div>
          </div>
          
          {/* Leave club button for current user */}
          {isOwner && (
            <div className="flex items-center">
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={handleShowLeaveConfirmation}
                disabled={isProcessingMember}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Club Members */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Club Members ({members.length})</h3>
        <div className="space-y-2">
          {members.length > 0 ? (
            members.map((member: any) => {
              const memberUser = member.user;
              const isMemberOwner = memberUser?.id === owner?.id;
              
              return (
                <div 
                  key={member.id} 
                  className={`flex items-center space-x-3 p-3 rounded-md border ${
                    isMemberOwner 
                      ? 'border-yellow-400 bg-yellow-50/20' 
                      : 'border-muted/20'
                  }`}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={memberUser?.image ?? undefined} alt={memberUser?.name ?? 'Member'} />
                      <AvatarFallback>{memberUser?.name?.charAt(0)?.toUpperCase() ?? 'M'}</AvatarFallback>
                    </Avatar>
                    {isMemberOwner && (
                      <Crown className="absolute -top-1 -right-1 h-3 w-3 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-foreground">
                      {memberUser?.name ?? 'Unknown Member'}
                    </span>
                    <div className="text-xs text-muted-foreground">
                      Status: <span className={`font-medium ${
                        member.status === 'approved' ? 'text-green-600' :
                        member.status === 'denied' ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                        {member.status}
                      </span>
                    </div>
                  </div>
                  
                  {/* Action buttons for owner */}
                  {isOwner && member.status === 'request' && (
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => handleRejectMember(member)}
                        disabled={isProcessingMember}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 w-8 p-0 bg-yellow-500 hover:bg-yellow-600 text-white"
                        onClick={() => handleShowApprovalConfirmation(member)}
                        disabled={isProcessingMember}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  {/* Remove button for approved members - only for club owner */}
                  {currentClub.user_id === hasyx.userId && member.status === 'approved' && !isMemberOwner && (
                    <div className="flex items-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => handleShowRemovalConfirmation(member)}
                        disabled={isProcessingMember}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  {/* Leave club button for current user */}
                  {member.user_id === hasyx.userId && member.status === 'approved' && (
                    <div className="flex items-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={handleShowLeaveConfirmation}
                        disabled={isProcessingMember}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center text-muted-foreground py-4">
              <p className="text-sm">No members yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Club Info */}
      <div className="mt-6 p-3 bg-muted/20 rounded-md">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Club Information</h3>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created:</span>
            <span>{currentClub.created_at ? new Date(currentClub.created_at).toLocaleDateString() : 'Unknown'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Updated:</span>
            <span>{currentClub.updated_at ? new Date(currentClub.updated_at).toLocaleDateString() : 'Unknown'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Members:</span>
            <span>{members.length + 1}</span>
          </div>
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Вы точно хотите принять {selectedMember?.user?.name || 'этого пользователя'} в клуб?</DialogTitle>
            <DialogDescription>
              После принятия пользователь станет полноправным членом клуба.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsConfirmDialogOpen(false)}
              disabled={isProcessingMember}
            >
              Отмена
            </Button>
            <Button 
              onClick={handleApproveMember}
              disabled={isProcessingMember}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              {isProcessingMember ? (
                <>
                  <LoaderCircle className="animate-spin h-4 w-4 mr-2" />
                  Принятие...
                </>
              ) : (
                'Принять в клуб'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Removal Confirmation Dialog */}
      <Dialog open={isRemovalDialogOpen} onOpenChange={setIsRemovalDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Вы точно хотите удалить {selectedMember?.user?.name || 'этого пользователя'} из клуба?</DialogTitle>
            <DialogDescription>
              После удаления пользователь перестанет быть членом клуба.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsRemovalDialogOpen(false)}
              disabled={isProcessingMember}
            >
              Отмена
            </Button>
            <Button 
              onClick={handleRemoveMember}
              disabled={isProcessingMember}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isProcessingMember ? (
                <>
                  <LoaderCircle className="animate-spin h-4 w-4 mr-2" />
                  Удаление...
                </>
              ) : (
                'Удалить из клуба'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Leave Club Confirmation Dialog */}
      <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Вы уверены, что хотите покинуть клуб?</DialogTitle>
            <DialogDescription>
              {currentClub?.user_id === hasyx.userId 
                ? 'Как владелец клуба, вы передадите управление клубом. Клуб станет бесхозным.' 
                : 'Вы перестанете быть членом этого клуба.'
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsLeaveDialogOpen(false)}
              disabled={isProcessingMember}
            >
              Отмена
            </Button>
            <Button 
              onClick={handleLeaveClub}
              disabled={isProcessingMember}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isProcessingMember ? (
                <>
                  <LoaderCircle className="animate-spin h-4 w-4 mr-2" />
                  Выход...
                </>
              ) : (
                'Покинуть клуб'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 