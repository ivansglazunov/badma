import React from 'react';
import { useSession } from 'next-auth/react';
import { useHasyx, useSubscription } from 'hasyx';
import { Avatar, AvatarFallback, AvatarImage } from 'hasyx/components/ui/avatar';
import { LoaderCircle, Crown } from 'lucide-react';

export const ClubTab: React.FC = () => {
  const { data: session } = useSession();
  const hasyx = useHasyx();

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
    </div>
  );
}; 