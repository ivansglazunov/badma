import React from 'react';
import { useHasyx, useSubscription } from 'hasyx';
import { Dialog, DialogContent } from 'hasyx/components/ui/dialog';
import { Button } from 'hasyx/components/ui/button';
import { HoverCard } from '@/components/hover-card';
import { SUPPORTED_ITEMS, COMPONENT_MAP } from '../lib/items';
import { Loader2 } from 'lucide-react';
import ChessExplodeEffect from '../lib/chess-explode-effect';

interface ItemData {
  id: string;
  type: string;
  created_at: number;
  definition: typeof SUPPORTED_ITEMS[0];
}

interface ItemAcceptCardProps {
  item: ItemData;
  onAccept: (itemId: string) => Promise<void>;
}

/**
 * Компонент для отображения одного айтема с эффектом взрыва
 */
function ItemAcceptCard({ item, onAccept }: ItemAcceptCardProps) {
  const [showExplosion, setShowExplosion] = React.useState(true);
  const [isAccepting, setIsAccepting] = React.useState(false);
  
  const ItemComponent = COMPONENT_MAP[item.type];
  if (!ItemComponent) return null;
  
  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await onAccept(item.id);
    } finally {
      setIsAccepting(false);
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      {/* Эффект взрыва под карточкой */}
      <ChessExplodeEffect 
        show={showExplosion}
        onComplete={() => setShowExplosion(false)}
      />
      
      <HoverCard
        force={1.3}
        maxRotation={25}
        maxLift={50}
      >
        <ItemComponent size="medium" />
      </HoverCard>
      
      <div className="flex flex-col items-center gap-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-2">
            Новый айтем получен!
          </h3>
          <p className="text-sm text-white/80">
            {item.definition.description}
          </p>
        </div>
        
        <Button
          onClick={handleAccept}
          disabled={isAccepting}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isAccepting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Принимаем...
            </>
          ) : (
            'Принять'
          )}
        </Button>
      </div>
    </div>
  );
}

interface CheckAvailableItemsProps {
  // No props needed - component manages its own state
}

export default function CheckAvailableItems({}: CheckAvailableItemsProps) {
  const hasyx = useHasyx();
  const [processedItemIds, setProcessedItemIds] = React.useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = React.useState(true);

  // Subscribe to unaccepted items for current user
  const { data: unacceptedItems } = useSubscription(
    {
      table: 'badma_items',
      where: {
        user_id: { _eq: hasyx.userId },
        accepted: { _eq: false }
      },
      returning: ['id', 'type', 'created_at']
    },
    { skip: !hasyx.userId }
  );

  // Get the first unaccepted item to show
  const currentItem = React.useMemo(() => {
    if (!unacceptedItems || unacceptedItems.length === 0) return null;
    
    // Sort by created_at to show oldest first
    const sortedItems = [...unacceptedItems]
      .sort((a, b) => a.created_at - b.created_at)
      // Фильтруем айтемы, которые уже были обработаны
      .filter(item => !processedItemIds.includes(item.id));
    
    if (sortedItems.length === 0) return null;
    
    const itemData = sortedItems[0];
    
    // Find the item definition
    const itemDefinition = SUPPORTED_ITEMS.find(item => item.id === itemData.type);
    if (!itemDefinition) return null;
    
    return {
      ...itemData,
      definition: itemDefinition
    };
  }, [unacceptedItems, processedItemIds]);
  
  // Сбрасываем список обработанных айтемов, если нет непринятых айтемов
  React.useEffect(() => {
    if (!unacceptedItems || unacceptedItems.length === 0) {
      setProcessedItemIds([]);
    }
  }, [unacceptedItems]);

  // Handle accepting an item
  const handleAcceptItem = async (itemId: string) => {
    try {
      await hasyx.update({
        table: 'badma_items',
        where: { id: { _eq: itemId } },
        _set: {
          accepted: true,
          accepted_at: Date.now()
        }
      });
      
      // Добавляем айтем в список обработанных
      setProcessedItemIds(prev => [...prev, itemId]);
      
      console.log('✅ [CHECK_ITEMS] Item accepted:', itemId);
    } catch (error) {
      console.error('❌ [CHECK_ITEMS] Failed to accept item:', error);
    }
  };

  // Обработчик закрытия диалога
  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    
    // Если диалог закрывается, помечаем все оставшиеся айтемы как обработанные
    if (!open && unacceptedItems) {
      // Добавляем все ID непринятых айтемов в список обработанных
      const allItemIds = unacceptedItems.map(item => item.id);
      setProcessedItemIds(prev => [...prev, ...allItemIds]);
      console.log('ℹ️ [CHECK_ITEMS] Dialog closed, skipping remaining items');
    }
  };

  // Не показываем диалог, если он закрыт или нет айтемов
  if (!isDialogOpen || !currentItem) return null;

  // Используем ключ для полного перемонтирования компонента при смене айтема
  const itemKey = currentItem.id;

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="p-0 border-0 bg-transparent max-w-none w-auto">
        {/* Используем key для принудительного перемонтирования компонента */}
        <ItemAcceptCard 
          key={itemKey}
          item={currentItem}
          onAccept={handleAcceptItem}
        />
      </DialogContent>
    </Dialog>
  );
}
