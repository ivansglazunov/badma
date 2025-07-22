'use client'

import { useSession } from 'next-auth/react';
import { useUserSettings } from '../../hooks/user-settings';
import { getPiecesStyle, PIECES_STYLES } from '../../lib/items';
import Board from '../../lib/board';

export default function TestSettingsPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  
  const { settings, loading, error } = useUserSettings(currentUserId);
  
  if (!currentUserId) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Тест настроек пользователя</h1>
        <p>Необходимо войти в систему для тестирования настроек.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Тест настроек пользователя</h1>
        <p>Загрузка настроек...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Тест настроек пользователя</h1>
        <p className="text-red-500">Ошибка загрузки настроек: {error.message}</p>
      </div>
    );
  }

  const piecesStyle = getPiecesStyle(settings.pieces === 'badma' ? 'badma_pieces' : 'classic_pieces');
  // For demo purposes, use the same style for both colors
  const whitePiecesStyle = piecesStyle;
  const blackPiecesStyle = piecesStyle;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Тест настроек пользователя</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Текущие настройки:</h2>
        <div className="bg-gray-100 p-4 rounded">
          <p><strong>User ID:</strong> {currentUserId}</p>
          <p><strong>Board:</strong> {settings.board}</p>
          <p><strong>Pieces:</strong> {settings.pieces}</p>
          <p><strong>Pieces Style ID:</strong> {piecesStyle?.id}</p>
          <p><strong>Pieces Style Name:</strong> {piecesStyle?.name}</p>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Доступные стили фигур:</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PIECES_STYLES.map(style => (
            <div key={style.id} className="border p-4 rounded">
              <h3 className="font-semibold">{style.name}</h3>
              <p className="text-sm text-gray-600">{style.description}</p>
              <div className="mt-2">
                <span className="inline-block w-4 h-4 rounded mr-2" style={{ backgroundColor: style.colors.white }}></span>
                <span className="text-sm">Белые: {style.colors.white}</span>
              </div>
              <div>
                <span className="inline-block w-4 h-4 rounded mr-2" style={{ backgroundColor: style.colors.black }}></span>
                <span className="text-sm">Черные: {style.colors.black}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Предварительный просмотр доски:</h2>
        <div className="w-96 h-96 mx-auto">
          <Board
            position="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
            whitePiecesStyle={whitePiecesStyle}
            blackPiecesStyle={blackPiecesStyle}
            bgBlack="#c084fc"
            bgWhite="#faf5ff"
          />
        </div>
      </div>
    </div>
  );
}
