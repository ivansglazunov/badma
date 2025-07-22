import React from 'react';
import { useHasyx, useSubscription } from 'hasyx';
import { Dialog, DialogContent } from 'hasyx/components/ui/dialog';
import { Button } from 'hasyx/components/ui/button';
import { HoverCard } from '@/components/hover-card';
import { SUPPORTED_ITEMS, COMPONENT_MAP } from '../lib/items';

interface CheckAvailableItemsProps {
  // No props needed - component manages its own state
}

export default function CheckAvailableItems({}: CheckAvailableItemsProps) {
  const hasyx = useHasyx();
  const [isAccepting, setIsAccepting] = React.useState(false);

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
    const sortedItems = [...unacceptedItems].sort((a, b) => a.created_at - b.created_at);
    const itemData = sortedItems[0];
    
    // Find the item definition
    const itemDefinition = SUPPORTED_ITEMS.find(item => item.id === itemData.type);
    if (!itemDefinition) return null;
    
    return {
      ...itemData,
      definition: itemDefinition
    };
  }, [unacceptedItems]);

  // Handle accepting an item
  const handleAcceptItem = async () => {
    if (!currentItem) return;
    
    setIsAccepting(true);
    try {
      await hasyx.update({
        table: 'badma_items',
        where: { id: { _eq: currentItem.id } },
        _set: {
          accepted: true,
          accepted_at: Date.now()
        }
      });
      
      console.log('✅ [CHECK_ITEMS] Item accepted:', currentItem.type);
    } catch (error) {
      console.error('❌ [CHECK_ITEMS] Failed to accept item:', error);
    } finally {
      setIsAccepting(false);
    }
  };

  // Don't show dialog if no items to show
  if (!currentItem) return null;

  const ItemComponent = COMPONENT_MAP[currentItem.type];
  if (!ItemComponent) return null;

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="p-0 border-0 bg-transparent max-w-none w-auto">
        <div className="flex flex-col items-center justify-center gap-6">
          <HoverCard
            force={1.3}
            maxRotation={25}
            maxLift={50}
          >
            <ItemComponent />
          </HoverCard>
          
          <div className="flex flex-col items-center gap-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">
                Новый айтем получен!
              </h3>
              <p className="text-sm text-white/80">
                {currentItem.definition.description}
              </p>
            </div>
            
            <Button
              onClick={handleAcceptItem}
              disabled={isAccepting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isAccepting ? 'Принимаем...' : 'Принять'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
