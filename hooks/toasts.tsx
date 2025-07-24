import { useEffect, useRef } from 'react';
import { useToastHandleError } from 'hasyx/hooks/toasts';
import { toast } from 'sonner';

export function useToastHandleParticipantsError(error: any) {
  useToastHandleError(error, "Error loading participants");
}

export function useToastHandleGamesError(error: any) {
  useToastHandleError(error, "Error loading games");
}

export function useToastHandleTournamentsError(error: any) {
  useToastHandleError(error, "Error loading tournaments");
}

export function useToastHandleClubsError(error: any) {
  useToastHandleError(error, "Error loading clubs");
}

export function useToastHandleClubError(error: any) {
  useToastHandleError(error, "Error loading club data");
}

export function useToastHandleGameError(error: any) {
  useToastHandleError(error, "Error loading game");
}
