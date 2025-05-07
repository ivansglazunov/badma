'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useClient } from 'hasyx';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "hasyx/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "hasyx/components/ui/table";
import { Badge } from "hasyx/components/ui/badge";
import { Skeleton } from "hasyx/components/ui/skeleton";
import Board from 'badma/lib/board';

// Компонент для отображения списка игр
function GamesList() {
  const hasyx = useClient();
  // Используем hasyx.useSubscription для подписки на обновления игр
  const { data = [] } = hasyx.useSubscription({
    table: 'badma_games',
    limit: 100,
    order_by: { created_at: 'desc' },
    returning: ['id', 'mode', 'status', 'fen', 'side', 'updated_at', 'created_at'],
  });

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-4">
        {data.map((game) => (
          <Card key={game.id} className="p-0 overflow-hidden">
            <Board position={game.fen} />
          </Card>
        ))}
      </div>
    </div>
  );
}

// Клиентский компонент
export default function GamesClient() {
  return <GamesList />;
} 