import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

/**
 * Hook для обработки ошибок с показом тостов
 * Показывает тост только один раз при изменении ошибки
 * @param error - объект ошибки или null
 * @param prefix - префикс для сообщения об ошибке (по умолчанию "Error")
 */
export function useToastHandleError(error: any, prefix: string = "Error") {
  const lastErrorRef = useRef<string | null>(null);

  useEffect(() => {
    // Если ошибки нет, сбрасываем последнюю ошибку
    if (!error) {
      lastErrorRef.current = null;
      return;
    }

    // Получаем текст ошибки
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    
    // Если ошибка изменилась, показываем тост
    if (errorMessage !== lastErrorRef.current) {
      lastErrorRef.current = errorMessage;
      
      // Показываем тост с ошибкой
      toast.error(`${prefix}: ${errorMessage}`, {
        duration: 5000,
        position: 'top-center',
      });
    }
  }, [error, prefix]);
}

/**
 * Специализированные хуки для разных типов ошибок
 */
export function useToastHandleLoadingError(error: any, resourceName: string = "data") {
  useToastHandleError(error, `Error loading ${resourceName}`);
}

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
