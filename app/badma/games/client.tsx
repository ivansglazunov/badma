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

// Компонент для отображения списка игр
function GamesList() {
  const hasyx = useClient();
  // Используем hasyx.useSubscription для подписки на обновления игр
  const result = hasyx.useSubscription({
    table: 'badma_games',
    limit: 100,
    order_by: { updated_at: 'desc' },
  });

  console.log(result);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* {data.map((game) => (
          <Card key={game.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Game #{game.id.substring(0, 6)}</CardTitle>
              <CardDescription>
                {game.mode} ({game.joins?.length || 0}/{game.sides} players)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-2">
                <Badge variant="outline">
                  {game.status}
                </Badge>
              </div>
              <div className="text-xs font-mono bg-muted p-2 rounded overflow-x-auto">
                <code>{game.fen || 'No FEN available'}</code>
              </div>
              <div className="mt-3 space-y-1">
                <div className="text-sm">
                  <span className="font-medium">Created by:</span> {game.user?.name || 'Unknown'}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Current side:</span> {game.side}
                </div>
              </div>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground pt-0">
              Last updated: {(game.updated_at)}
            </CardFooter>
          </Card>
        ))} */}
      </div>
    </div>
  );
}

// Клиентский компонент
export default function GamesClient() {
  return <GamesList />;
} 