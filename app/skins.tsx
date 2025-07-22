import React from 'react';
import { useHasyx, useSubscription } from 'hasyx';
import { HoverCard } from '@/components/hover-card';
import { Badge } from 'hasyx/components/ui/badge';
import { Button } from 'hasyx/components/ui/button';
import {
  Dialog,
  DialogContent,
} from 'hasyx/components/ui/dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from 'hasyx/components/ui/carousel';
import { SUPPORTED_ITEMS } from '../lib/items';
import { useUserSettings } from '../hooks/user-settings';
import { setSetting } from '../lib/settings';
import { Check, Lock, Gift, CheckCircle, Loader2 } from 'lucide-react';
import Grant from './grant';

interface SkinsProps {
  // No longer need onItemSelect since we handle dialog internally
}

export default function Skins({}: SkinsProps) {
  const hasyx = useHasyx();
  const [showExplosion, setShowExplosion] = React.useState(true);
  const [selectedItem, setSelectedItem] = React.useState<typeof SUPPORTED_ITEMS[0] | null>(null);
  const [isApplyingSetting, setIsApplyingSetting] = React.useState(false);

  // Get user settings using the hook
  const { settings: userSettings, loading: settingsLoading } = useUserSettings(hasyx.userId || undefined);

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
          <Badge variant="secondary" className="absolute -top-2 -right-2 bg-green-500 text-white">
            <Check className="w-3 h-3 mr-1" />
            Принят
          </Badge>
        );
      default:
        return null;
    }
  };

  // Check if item is currently selected
  const isItemSelected = (itemId: string) => {
    // Remove _pieces or _board suffix to get base setting value
    const baseId = itemId.replace(/_pieces$|_board$/, '');
    return userSettings.board === baseId || userSettings.pieces === baseId;
  };

  // Get selected indicator for active items
  const getSelectedIndicator = (itemId: string) => {
    if (!isItemSelected(itemId)) return null;
    
    return (
      <div className="absolute -top-2 -left-2 bg-green-600 text-white rounded-full p-1 flex items-center gap-1 text-xs font-medium shadow-lg">
        <CheckCircle className="w-3 h-3" />
        <span>Выбрано</span>
      </div>
    );
  };

  // Apply setting for selected item
  const handleApplySetting = async () => {
    if (!selectedItem) return;
    
    setIsApplyingSetting(true);
    
    try {
      // Determine setting key and value based on item category
      const settingKey = selectedItem.category; // 'board' or 'pieces'
      const settingValue = selectedItem.id.replace(`_${selectedItem.category}`, ''); // Remove suffix
      
      await setSetting(hasyx, settingKey, settingValue);
      
      // Close dialog after successful application
      setSelectedItem(null);
    } catch (error) {
      console.error('Failed to apply setting:', error);
    } finally {
      setIsApplyingSetting(false);
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
        <div className="px-12">
          <h2 className="text-2xl font-bold mb-4 text-center">Доски</h2>
          <Carousel 
            className="w-full max-w-5xl mx-auto"
            opts={{
              dragFree: false,
              containScroll: "trimSnaps"
            }}
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {SUPPORTED_ITEMS.filter(item => item.category === 'board').map(item => {
                const ItemComponent = item.Component;
                return (
                  <CarouselItem key={item.id} className="pl-2 md:pl-4 basis-1/2 md:basis-1/2 lg:basis-1/3">
                    <div 
                      className="flex flex-col items-center relative p-4"
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                    >
                      <div className="relative">
                        <ItemComponent 
                          onClick={() => setSelectedItem(item)}
                          className="mb-2" 
                        />
                        {getStatusBadge(item.id)}
                        {getSelectedIndicator(item.id)}
                      </div>
                      <p className="text-xs text-muted-foreground text-center max-w-48">
                        {item.description}
                      </p>
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </Carousel>
        </div>
        
        {/* Наборы */}
        <div className="px-12">
          <h2 className="text-2xl font-bold mb-4 text-center">Наборы</h2>
          <Carousel 
            className="w-full max-w-5xl mx-auto"
            opts={{
              dragFree: false,
              containScroll: "trimSnaps"
            }}
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {SUPPORTED_ITEMS.filter(item => item.category === 'pieces').map(item => {
                const ItemComponent = item.Component;
                return (
                  <CarouselItem key={item.id} className="pl-2 md:pl-4 basis-1/2 md:basis-1/2 lg:basis-1/3">
                    <div 
                      className="flex flex-col items-center relative p-4"
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                    >
                      <div className="relative">
                        <ItemComponent 
                          onClick={() => setSelectedItem(item)}
                          className="mb-2" 
                        />
                        {getStatusBadge(item.id)}
                        {getSelectedIndicator(item.id)}
                      </div>
                      <p className="text-xs text-muted-foreground text-center max-w-48">
                        {item.description}
                      </p>
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </Carousel>
        </div>
      </div>
      </div>
      
      {/* Item Selection Dialog */}
      {selectedItem && (
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="p-0 border-0 bg-transparent max-w-none w-auto">
            <div className="flex flex-col items-center justify-center">
              <HoverCard
                force={1.5}
                maxRotation={25}
                maxLift={50}
                useDeviceOrientation={true}
                orientationSensitivity={0.8}
              >
                <selectedItem.Component size="large" />
              </HoverCard>
              <p className="text-sm text-muted-foreground mt-4 text-center max-w-md">
                {selectedItem.description}
              </p>
              
              {/* Selection Button */}
              <div className="mt-6">
                {isItemSelected(selectedItem.id) ? (
                  <Button 
                    variant="outline" 
                    className="border-green-500 text-green-600 hover:bg-green-50"
                    disabled
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Выбрано
                  </Button>
                ) : itemsStatus[selectedItem.id] === 'not_owned' ? (
                  <Button 
                    variant="outline"
                    className="border-gray-400 text-gray-500 bg-gray-100"
                    disabled
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Не в коллекции
                  </Button>
                ) : (
                  <Button 
                    onClick={handleApplySetting}
                    disabled={isApplyingSetting}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isApplyingSetting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Применяется...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Выбрать
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
