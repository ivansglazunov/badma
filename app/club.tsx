import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useHasyx, useSubscription } from 'hasyx';
import { Avatar, AvatarFallback, AvatarImage } from 'hasyx/components/ui/avatar';
import { Input } from 'hasyx/components/ui/input';
import { Button } from 'hasyx/components/ui/button';
import { LoaderCircle, Crown, Check, X, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from 'hasyx/components/ui/dialog';
import { useToastHandleClubError } from '@/hooks/toasts';
import { useTranslations } from 'hasyx';

export const ClubTab: React.FC<{ kind?: 'club' | 'school'; onFind?: () => void; onCreate?: () => void }> = ({ kind = 'club', onFind, onCreate }) => {
  const t = useTranslations();
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

  // Get groups (clubs/schools) data for current user: owner or member
  const { data: clubsData, loading: clubsLoading, error: clubsError } = useSubscription(
    {
      table: 'groups',
      where: {
        kind: { _eq: kind },
        _or: [
          { owner_id: { _eq: hasyx.userId } },
          { memberships: { user_id: { _eq: hasyx.userId }, status: { _in: ['approved', 'request'] } } }
        ]
      },
      returning: [
        'id',
        'title',
        'created_at',
        'updated_at',
        { owner: ['id', 'name', 'image'] },
        { 
          memberships: [
            'id',
            'user_id',
            'status',
            'created_by_id',
            'created_at',
            'updated_at',
            { user: ['id', 'name', 'image'] }
          ]
        }
      ]
    },
    { skip: !hasyx.userId, role: 'user' }
  );

  // Обрабатываем ошибки через тост
  useToastHandleClubError(clubsError);

  // Format clubs data
  const clubsDataFormatted = React.useMemo(() => {
    if (!clubsData) return null;
    if (Array.isArray(clubsData)) return clubsData;
    if ((clubsData as any).groups) return (clubsData as any).groups;
    return clubsData;
  }, [clubsData]);

  // Get the first entity (assuming user is in one)
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
        table: 'groups',
        where: { id: { _eq: currentClub.id } },
        _set: { title: titleValue }
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
        table: 'memberships',
        where: { id: { _eq: member.id } },
        _set: { status: 'denied' }
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
        table: 'memberships',
        where: { id: { _eq: selectedMember.id } },
        _set: { status: 'approved' }
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
        table: 'memberships',
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
      const isOwner = currentClub.owner?.id === hasyx.userId;
      if (isOwner) {
        // owner resign: set owner_id to null (Hasyx triggers handle ownership policy)
        await hasyx.update({
          table: 'groups',
          where: { id: { _eq: currentClub.id } },
          _set: { owner_id: null }
        });
      } else {
        const userMembership = members.find((m: any) => m.user_id === hasyx.userId);
        if (userMembership) {
          await hasyx.update({
            table: 'memberships',
            where: { id: { _eq: userMembership.id } },
            _set: { status: 'left' }
          });
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
        {t('badma.app.loading')}
      </div>
    );
  }

  if (!currentClub) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <div className="flex flex-col gap-2 items-center">
          <p>
            {kind === 'club' ? t('badma.app.clubs') : t('badma.app.schools')}
          </p>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 rounded-full text-xs border border-purple-500 text-purple-600 hover:bg-purple-50"
              onClick={onFind}
            >
              {kind === 'club' ? t('badma.app.club') : t('badma.app.school')}
            </button>
            <button
              className="px-3 py-1 rounded-full text-xs bg-yellow-500 hover:bg-yellow-600 text-white"
              onClick={onCreate}
            >
              {kind === 'club' ? t('badma.app.createClub') : t('badma.app.createClub')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const owner = currentClub.owner;
  const members = currentClub.memberships || [];
  const isOwner = owner?.id === hasyx.userId;

  return (
    <div className="space-y-4 p-1">
      {/* Title */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">{kind === 'club' ? t('badma.app.club') : t('badma.app.school')} Title</h3>
        <div className="flex items-center space-x-2">
          <Input
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            placeholder={kind === 'club' ? t('badma.app.club') : t('badma.app.school')}
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

      {/* Owner */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">{kind === 'club' ? t('badma.app.club') : t('badma.app.school')} Owner</h3>
        <div className={`flex items-center space-x-3 p-3 rounded-md border-2 ${isOwner ? 'border-yellow-400 bg-yellow-50/20' : 'border-muted/20'}`}>
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarImage src={owner?.image ?? undefined} alt={owner?.name ?? 'Owner'} />
              <AvatarFallback>{owner?.name?.charAt(0)?.toUpperCase() ?? 'O'}</AvatarFallback>
            </Avatar>
            <Crown className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500 fill-yellow-500" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium text-foreground">{owner?.name ?? t('badma.app.unknown')}</span>
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

      {/* Members */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">{kind === 'club' ? t('badma.app.club') : t('badma.app.school')} Members ({members.length})</h3>
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
                  {currentClub.owner?.id === hasyx.userId && member.status === 'approved' && !isMemberOwner && (
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
              <p className="text-sm">{t('badma.app.noMembers')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Club Info */}
      <div className="mt-6 p-3 bg-muted/20 rounded-md">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">{t('badma.app.clubInformation')}</h3>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('badma.app.created')}:</span>
            <span>{currentClub.created_at ? new Date(currentClub.created_at).toLocaleDateString() : t('badma.app.unknown')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('badma.app.lastUpdated')}:</span>
            <span>{currentClub.updated_at ? new Date(currentClub.updated_at).toLocaleDateString() : t('badma.app.unknown')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('badma.app.totalMembers')}:</span>
            <span>{members.length + 1}</span>
          </div>
        </div>
      </div>

      {/* Apply button (always visible on profile page) */}
      <div className="mt-4">
        <Button 
          onClick={async () => {
            try {
              await hasyx.insert({
                table: 'memberships',
                object: { group_id: currentClub.id }
              });
            } catch (e) {
              console.error('Error submitting application:', e);
            }
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          {t('badma.app.submitApplication')}
        </Button>
      </div>
      
      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('badma.app.confirmAcceptUser', { name: selectedMember?.user?.name || 'этого пользователя' })}</DialogTitle>
            <DialogDescription>
              {t('badma.app.acceptUserDescription')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsConfirmDialogOpen(false)}
              disabled={isProcessingMember}
            >
              {t('badma.app.cancel')}
            </Button>
            <Button 
              onClick={handleApproveMember}
              disabled={isProcessingMember}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              {isProcessingMember ? (
                <>
                  <LoaderCircle className="animate-spin h-4 w-4 mr-2" />
                  {t('badma.app.accepting')}
                </>
              ) : (
                t('badma.app.acceptToClub')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Removal Confirmation Dialog */}
      <Dialog open={isRemovalDialogOpen} onOpenChange={setIsRemovalDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('badma.app.confirmRemoveUser', { name: selectedMember?.user?.name || 'этого пользователя' })}</DialogTitle>
            <DialogDescription>
              {t('badma.app.removeUserDescription')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsRemovalDialogOpen(false)}
              disabled={isProcessingMember}
            >
              {t('badma.app.cancel')}
            </Button>
            <Button 
              onClick={handleRemoveMember}
              disabled={isProcessingMember}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isProcessingMember ? (
                <>
                  <LoaderCircle className="animate-spin h-4 w-4 mr-2" />
                  {t('badma.app.removing')}
                </>
              ) : (
                t('badma.app.removeFromClub')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Leave Club Confirmation Dialog */}
      <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('badma.app.confirmLeaveClub')}</DialogTitle>
            <DialogDescription>
              {currentClub?.owner?.id === hasyx.userId 
                ? t('badma.app.leaveClubOwnerDescription')
                : t('badma.app.leaveClubMemberDescription')
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsLeaveDialogOpen(false)}
              disabled={isProcessingMember}
            >
              {t('badma.app.cancel')}
            </Button>
            <Button 
              onClick={handleLeaveClub}
              disabled={isProcessingMember}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isProcessingMember ? (
                <>
                  <LoaderCircle className="animate-spin h-4 w-4 mr-2" />
                  {t('badma.app.leaving')}
                </>
              ) : (
                t('badma.app.leaveClub')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 