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
import { BOARD_STYLES, PERK_TYPES, PIECES_STYLES, SUPPORTED_ITEMS } from '../lib/items';
import { useUserSettings } from '../hooks/user-settings';
import { setSetting } from '../lib/settings';
import { Check, Lock, Gift, CheckCircle, Loader2 } from 'lucide-react';
import Grant from './grant';
import ChessExplodeEffect from '../lib/chess-explode-effect';
import { ItemType } from '../lib/items';
import { COLORS, COLOR_CIRCLE_BG_CLASS } from '../lib/colors';
import { useColor } from '../lib/color';

// Компонент для отдельного айтема
interface SkinItemProps {
  item: ItemType;
  itemsStatus: Record<string, 'not_owned' | 'owned' | 'accepted'>;
  onItemClick: (item: ItemType) => void;
  onExplosionTrigger: () => void;
}

function SkinItem({ item, itemsStatus, onItemClick, onExplosionTrigger }: SkinItemProps) {
  const { getSetting } = useUserSettings();

  const getStatusBadge = (itemId: string) => {
    const status = itemsStatus[itemId] || 'not_owned';

    switch (status) {
      case 'not_owned':
        return (
          <Badge variant="secondary" className="absolute -top-2 -right-2 bg-gray-500 text-white text-xs px-2 py-1 z-10">
            <Lock className="w-3 h-3 mr-1" />
            Не в коллекции
          </Badge>
        );
      case 'owned':
        return (
          <Badge variant="secondary" className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 z-10">
            <Gift className="w-3 h-3 mr-1" />
            Получен
          </Badge>
        );
      case 'accepted':
        const isSelected = getSetting(item.category as 'board' | 'pieces') === item.id;
        return (
          <Badge
            variant="secondary"
            className={`absolute -top-2 -right-2 text-white text-xs px-2 py-1 z-10 ${isSelected ? 'bg-purple-600' : 'bg-green-500'
              }`}
          >
            <Check className="w-3 h-3 mr-1" />
            {isSelected ? 'Активен' : 'Принят'}
          </Badge>
        );
      default:
        return null;
    }
  };

  const getSelectedIndicator = (itemId: string) => {
    const isSelected = getSetting(item.category as 'board' | 'pieces') === itemId;

    if (isSelected) {
      return (
        <div className="absolute inset-0 border-4 border-purple-500 rounded-lg pointer-events-none" />
      );
    }
    return null;
  };

  const ItemComponent = item.ItemComponent;

  return (
    <CarouselItem className="basis-[250px] flex-shrink-0">
      <div
        className="flex flex-col items-center relative p-4 w-[250px]"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <ItemComponent
            onClick={() => {
              onItemClick(item);
              // Показываем эффект взрыва только для непринятых айтемов
              if (itemsStatus[item.id] === 'owned') {
                onExplosionTrigger();
              }
            }}
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
}

interface SkinsProps {
  children?: React.ReactNode;
}

export default function Skins({ children }: SkinsProps) {
  const hasyx = useHasyx();
  const [showExplosion, setShowExplosion] = React.useState(true);
  const [selectedItem, setSelectedItem] = React.useState<typeof SUPPORTED_ITEMS[0] | null>(null);
  const [isApplyingSetting, setIsApplyingSetting] = React.useState(false);
  const [showItemExplosion, setShowItemExplosion] = React.useState(false);

  // Get user settings from zustand store
  const { settings: userSettings, loading: settingsLoading, getSetting, updateSetting } = useUserSettings();
  const { colorId, setColor } = useColor();

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

  // Check if item is currently selected
  const isItemSelected = (itemId: string) => {
    return getSetting(selectedItem?.category as 'board' | 'pieces') === itemId;
  };

  // Apply setting for selected item
  const handleApplySetting = async () => {
    if (!selectedItem) return;

    setIsApplyingSetting(true);

    try {
      // Determine setting key and value based on item category
      const settingKey = selectedItem.category as 'board' | 'pieces';
      const settingValue = selectedItem.id;

      // Update zustand store immediately for instant UI update
      updateSetting(settingKey, settingValue);

      // Save to database in background
      await setSetting(hasyx, settingKey, settingValue);

      // Close dialog after successful application
      setSelectedItem(null);
    } catch (error) {
      console.error('Failed to apply setting:', error);
      // TODO: Revert zustand store update on error
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

      <div className="flex flex-col items-center justify-start pt-4 overflow-y-auto h-full">
        <div className="w-full max-w-4xl space-y-8 h-full">
          {/* Цвета интерфейса (горизонтальный слайдер) */}
          <div className="">
            <h2 className="text-2xl font-bold mb-4 text-center">Colors</h2>
            <div className="h-[60px] w-full">
              <Carousel
                className="w-full max-w-5xl mx-auto"
                opts={{
                  dragFree: false,
                  containScroll: "trimSnaps",
                  watchDrag: (emblaApi, event) => {
                    // Предотвращаем всплытие события к родительскому слайдеру
                    event.stopPropagation();
                    return true;
                  }
                }}
              >
                <CarouselContent className="-ml-2 md:-ml-4">
              {Object.keys(COLORS).map((id) => (
                    <CarouselItem key={id} className="basis-[90px] flex-shrink-0">
                      <div className="flex items-center justify-center">
                <button
                  onClick={() => setColor(id as any)}
                  className={`w-12 h-12 rounded-full border-2 transition-all flex items-center justify-center ${
                    (colorId === id) ? 'border-purple-500' : 'border-border hover:border-purple-300'
                  }`}
                >
                  <span className={`w-8 h-8 rounded-full ${COLOR_CIRCLE_BG_CLASS[id as keyof typeof COLOR_CIRCLE_BG_CLASS]}`} />
                </button>
                      </div>
                    </CarouselItem>
              ))}
                </CarouselContent>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </Carousel>
            </div>
          </div>
          {/* Наборы */}
          <div className="">
            <h2 className="text-2xl font-bold mb-4 text-center">Наборы фигур</h2>
            <div className="h-[300px] w-full">
              <Carousel
                className="w-full max-w-5xl mx-auto"
                opts={{
                  dragFree: false,
                  containScroll: "trimSnaps",
                  watchDrag: (emblaApi, event) => {
                    // Предотвращаем всплытие события к родительскому слайдеру
                    event.stopPropagation();
                    return true; // Разрешаем перетаскивание для этого слайдера
                  }
                }}
              >
                <CarouselContent className="-ml-2 md:-ml-4">
                  {PIECES_STYLES.map(item => (
                    <SkinItem
                      key={item.id}
                      item={item}
                      itemsStatus={itemsStatus}
                      onItemClick={setSelectedItem}
                      onExplosionTrigger={() => setShowItemExplosion(true)}
                    />
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </Carousel>
            </div>
          </div>

          {/* Доски */}
          <div className="">
            <h2 className="text-2xl font-bold mb-4 text-center">Доски</h2>
            <div className="h-[300px] w-full">
              <Carousel
                className="w-full max-w-5xl mx-auto"
                opts={{
                  dragFree: false,
                  containScroll: "trimSnaps",
                  watchDrag: (emblaApi, event) => {
                    // Предотвращаем всплытие события к родительскому слайдеру
                    event.stopPropagation();
                    return true; // Разрешаем перетаскивание для этого слайдера
                  }
                }}
              >
                <CarouselContent className="-ml-2 md:-ml-4">
                  {BOARD_STYLES.map(item => (
                    <SkinItem
                      key={item.id}
                      item={item}
                      itemsStatus={itemsStatus}
                      onItemClick={setSelectedItem}
                      onExplosionTrigger={() => setShowItemExplosion(true)}
                    />
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </Carousel>
            </div>
          </div>

          {/* Перки */}
          <div className="">
            <h2 className="text-2xl font-bold mb-4 text-center">Перки</h2>
            <div className="h-[300px] w-full">
              <Carousel
                className="w-full max-w-5xl mx-auto"
                opts={{
                  dragFree: false,
                  containScroll: "trimSnaps",
                  watchDrag: (emblaApi, event) => {
                    // Предотвращаем всплытие события к родительскому слайдеру
                    event.stopPropagation();
                    return true; // Разрешаем перетаскивание для этого слайдера
                  }
                }}
              >
                <CarouselContent className="-ml-2 md:-ml-4">
                  {PERK_TYPES.map(item => (
                    <SkinItem
                      key={item.id}
                      item={item}
                      itemsStatus={itemsStatus}
                      onItemClick={setSelectedItem}
                      onExplosionTrigger={() => setShowItemExplosion(true)}
                    />
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </Carousel>
            </div>
          </div>
        </div>
      </div>

      {/* Item Selection Dialog */}
      {selectedItem && (
        <Dialog open={!!selectedItem} onOpenChange={() => {
          setSelectedItem(null);
          setShowItemExplosion(false);
        }}>
          <DialogContent className="p-0 border-0 bg-transparent max-w-none w-auto">
            <div className="flex flex-col items-center justify-center">
              {/* Эффект взрыва для непринятых айтемов */}
              <ChessExplodeEffect
                show={showItemExplosion}
                onComplete={() => setShowItemExplosion(false)}
              />

              <HoverCard
                force={1.5}
                maxRotation={25}
                maxLift={50}
                useDeviceOrientation={true}
                orientationSensitivity={0.8}
              >
                <selectedItem.ItemComponent size="medium" />
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
                ) : itemsStatus[selectedItem.id] === 'owned' ? (
                  // Кнопка "Принять" для непринятых айтемов
                  <Button
                    onClick={async () => {
                      setIsApplyingSetting(true);
                      try {
                        // Находим ID айтема в базе данных
                        const item = itemsData?.find((item: any) => item.type === selectedItem.id);
                        if (item) {
                          await hasyx.update({
                            table: 'badma_items',
                            where: { id: { _eq: item.id } },
                            _set: {
                              accepted: true,
                              accepted_at: Date.now()
                            }
                          });
                          console.log('✅ [SKINS] Item accepted:', selectedItem.id);
                        }
                        setSelectedItem(null);
                        setShowItemExplosion(false);
                      } catch (error) {
                        console.error('❌ [SKINS] Failed to accept item:', error);
                      } finally {
                        setIsApplyingSetting(false);
                      }
                    }}
                    disabled={isApplyingSetting}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isApplyingSetting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Принимаем...
                      </>
                    ) : (
                      <>
                        <Gift className="w-4 h-4 mr-2" />
                        Принять
                      </>
                    )}
                  </Button>
                ) : (
                  // Кнопка "Выбрать" для принятых айтемов
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

      {/* Render children components */}
      {children}
    </>
  );
}
