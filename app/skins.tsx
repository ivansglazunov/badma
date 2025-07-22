import React from 'react';
import { useHasyx, useSubscription } from 'hasyx';
import { HoverCard } from 'hasyx/components/ui/hover-card';
import { Badge } from 'hasyx/components/ui/badge';
import { SUPPORTED_ITEMS } from '../lib/items';
import { getUserSettings, UserSetting } from '../lib/settings';
import { Check, Lock, Gift } from 'lucide-react';
import Grant from './grant';

interface SkinsProps {
  onItemSelect?: (item: any) => void;
}

export default function Skins({ onItemSelect }: SkinsProps) {
  const hasyx = useHasyx();
  const [showExplosion, setShowExplosion] = React.useState(true);

  // Subscribe to user settings
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

  // Subscribe to user items
  const { data: itemsData } = useSubscription(
    {
      table: 'badma_items',
      where: {
        user_id: { _eq: hasyx.userId }
      },
      returning: ['id', 'type', 'accepted', 'accepted_at']
    },
    { skip: !hasyx.userId }
  );

  // Compute settings object from subscription data
  const userSettings = React.useMemo(() => {
    return getUserSettings(settingsData as UserSetting[]);
  }, [settingsData]);

  // Create items status map
  const itemsStatus = React.useMemo(() => {
    const statusMap: Record<string, 'not_owned' | 'owned' | 'accepted'> = {};
    
    SUPPORTED_ITEMS.forEach(item => {
      statusMap[item.id] = 'not_owned';
    });

    if (itemsData) {
      itemsData.forEach((item: any) => {
        if (item.accepted) {
          statusMap[item.type] = 'accepted';
        } else {
          statusMap[item.type] = 'owned';
        }
      });
    }

    return statusMap;
  }, [itemsData]);

  // Get status badge for item
  const getStatusBadge = (itemId: string) => {
    const status = itemsStatus[itemId];
    const isActive = userSettings.board === itemId || userSettings.pieces === itemId;

    switch (status) {
      case 'not_owned':
        return (
          <Badge variant="secondary" className="absolute -top-2 -right-2 bg-gray-500 text-white">
            <Lock className="w-3 h-3 mr-1" />
            Не в коллекции
          </Badge>
        );
      case 'owned':
        return (
          <Badge variant="secondary" className="absolute -top-2 -right-2 bg-blue-500 text-white">
            <Gift className="w-3 h-3 mr-1" />
            Получен
          </Badge>
        );
      case 'accepted':
        return (
          <Badge 
            variant="secondary" 
            className={`absolute -top-2 -right-2 ${
              isActive 
                ? 'bg-green-600 text-white' 
                : 'bg-green-500 text-white'
            }`}
          >
            <Check className="w-3 h-3 mr-1" />
            {isActive ? 'Активен' : 'Принят'}
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Explosion effect on skins load */}
      <Grant 
        show={showExplosion} 
        onComplete={() => setShowExplosion(false)} 
      />
      
      <div className="h-full flex flex-col items-center justify-start p-4 overflow-y-auto">
      <div className="w-full max-w-4xl space-y-8">
        {/* Доски */}
        <div>
          <h2 className="text-2xl font-bold mb-4 text-center">Доски</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
            {SUPPORTED_ITEMS.filter(item => item.category === 'board').map(item => {
              const ItemComponent = item.Component;
              return (
                <div key={item.id} className="flex flex-col items-center relative">
                  <div className="relative">
                    <ItemComponent 
                      onClick={() => onItemSelect?.(item)}
                      className="mb-2" 
                    />
                    {getStatusBadge(item.id)}
                  </div>
                  <p className="text-xs text-muted-foreground text-center max-w-48">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Наборы */}
        <div>
          <h2 className="text-2xl font-bold mb-4 text-center">Наборы</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
            {SUPPORTED_ITEMS.filter(item => item.category === 'pieces').map(item => {
              const ItemComponent = item.Component;
              return (
                <div key={item.id} className="flex flex-col items-center relative">
                  <div className="relative">
                    <ItemComponent 
                      onClick={() => onItemSelect?.(item)}
                      className="mb-2" 
                    />
                    {getStatusBadge(item.id)}
                  </div>
                  <p className="text-xs text-muted-foreground text-center max-w-48">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
