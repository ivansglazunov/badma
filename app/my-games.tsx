import React from 'react';
import { useSubscription } from 'hasyx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "hasyx/components/ui/tabs";
import { LoaderCircle, GamepadIcon, CheckCircle, Clock, Mail } from 'lucide-react';
import { useToastHandleGamesError } from "@/hooks/toasts";

// Определяем интерфейсы для типизации
interface Game {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  moves?: Array<{id: string}>;
}

interface Join {
  id: string;
  side: number;
  created_at?: string;
  game: Game;
}

interface UserGamesProps {
  userId: string;
  onGameClick: (gameId: string) => void;
}

const UserGames: React.FC<UserGamesProps> = ({ userId, onGameClick }) => {
  const [activeTab, setActiveTab] = React.useState('all');

  // Генератор запроса на основе активной вкладки
  const subscriptionQuery = React.useMemo(() => {
    const baseQuery: any = {
      table: 'badma_joins',
      where: { 
        user_id: { _eq: userId },
        role: { _eq: 1 } // Only player joins
      },
      returning: [
        'id',
        'side',
        'created_at',
        {
          game: [
            'id',
            'status',
            'created_at',
            'updated_at',
            {
              moves: ['id']
            }
          ]
        }
      ],
      order_by: { created_at: 'desc' }
    };

    // Фильтрация по статусам в зависимости от вкладки
    if (activeTab === 'completed') {
      baseQuery.where = {
        ...baseQuery.where,
        game: {
          status: {
            _in: ['finished', 'checkmate', 'stalemate', 'draw', 'white_surrender', 'black_surrender']
          }
        }
      };
    } else if (activeTab === 'active') {
      baseQuery.where = {
        ...baseQuery.where,
        game: {
          status: {
            _in: ['ready', 'continue']
          }
        }
      };
    } else if (activeTab === 'invitations') {
      baseQuery.where = {
        ...baseQuery.where,
        game: {
          status: {
            _eq: 'await'
          }
        }
      };
    }
    // Для 'all' не добавляем дополнительных фильтров

    return baseQuery;
  }, [userId, activeTab]);

  const { data, loading, error } = useSubscription(subscriptionQuery, { skip: !userId });

  console.log('UserGames data:', data, 'error:', error, 'loading:', loading, 'userId:', userId, 'activeTab:', activeTab);

  const games = React.useMemo(() => {
    if (Array.isArray(data)) return data;
    if (data && (data as any).badma_joins) return (data as any).badma_joins;
    return [];
  }, [data]);

  // Обрабатываем ошибки через тост
  useToastHandleGamesError(error);

  const renderGamesList = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center p-4">
          <LoaderCircle className="animate-spin h-6 w-6 text-purple-500 mr-2" />
          Loading games...
        </div>
      );
    }

    if (!games.length) {
      return (
        <p className="p-4 text-muted-foreground text-center">
          {activeTab === 'all' && 'No games found.'}
          {activeTab === 'completed' && 'No completed games found.'}
          {activeTab === 'active' && 'No active games found.'}
          {activeTab === 'invitations' && 'No pending invitations found.'}
        </p>
      );
    }

    return (
      <div className="space-y-2 p-1">
        {games.map((join: Join) => {
          const game = join.game;
          const moveCount = game.moves?.length || 0;
          const isFinished = ['finished', 'checkmate', 'stalemate', 'draw', 'white_surrender', 'black_surrender'].includes(game.status);
          const isActive = ['ready', 'continue'].includes(game.status);
          const isInvitation = game.status === 'await';
          const sideText = join.side === 1 ? 'White' : 'Black';
          
          return (
            <div 
              key={join.id} 
              className="flex items-center justify-between p-3 hover:bg-muted/30 rounded-md cursor-pointer border border-muted/20"
              onClick={() => onGameClick(game.id)}
            >
              <div className="flex flex-col flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-foreground">Game ID: {game.id.substring(0, 8)}...</span>
                  <span className="text-xs px-1.5 py-0.5 bg-muted rounded">{sideText}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  <span>{moveCount} moves</span>
                  {game.created_at && (
                    <span className="ml-3">Created: {new Date(game.created_at).toLocaleDateString()}</span>
                  )}
                  {game.updated_at && game.updated_at !== game.created_at && (
                    <span className="ml-3">Updated: {new Date(game.updated_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                isFinished
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : isActive
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : isInvitation
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
              }`}>
                {game.status ?? 'Unknown'}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col">
        {/* Фиксированные табы, которые не будут скроллиться */}
        <div className="flex-none">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="flex items-center">
              <GamepadIcon className="h-4 w-4 mr-1" />
              Все
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-1" />
              Завершенные
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Активные
            </TabsTrigger>
            <TabsTrigger value="invitations" className="flex items-center">
              <Mail className="h-4 w-4 mr-1" />
              Приглашения
            </TabsTrigger>
          </TabsList>
        </div>
        
        {/* Скроллируемый контент табов */}
        <div className="flex-1 overflow-y-auto max-h-[400px]">
          <TabsContent value="all" className="pt-4">
            {renderGamesList()}
          </TabsContent>
          
          <TabsContent value="completed" className="pt-4">
            {renderGamesList()}
          </TabsContent>
          
          <TabsContent value="active" className="pt-4">
            {renderGamesList()}
          </TabsContent>
          
          <TabsContent value="invitations" className="pt-4">
            {renderGamesList()}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default UserGames;
