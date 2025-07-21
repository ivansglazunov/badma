# Captured Pieces Utility

Утилита для подсчета и анализа съеденных фигур в шахматной партии.

## Основные возможности

- ✅ Подсчет съеденных фигур для каждой стороны
- ✅ Сортировка фигур по ценности (от слабых к сильным)
- ✅ Расчет материального преимущества
- ✅ Unicode символы для визуализации
- ✅ Компактное форматирование для UI
- ✅ Группировка фигур по типам

## Быстрый старт

```typescript
import { Chess } from './chess';
import { getCapturedPiecesForClient, getAllCapturedPieces } from './captured-pieces';

const chess = new Chess();
// ... играем ходы ...

// Для конкретного клиента (1 = белые, 2 = черные)
const whiteCaptured = getCapturedPiecesForClient(chess, 1);
console.log('Белые захватили:', whiteCaptured.pieces); // отсортировано по ценности

// Полный анализ
const analysis = getAllCapturedPieces(chess);
console.log('Материальное преимущество:', analysis.materialAdvantage);
```

## Ценности фигур

Используются стандартные шахматные ценности:
- Пешка (p): 1 очко
- Конь (n): 3 очка  
- Слон (b): 3 очка
- Ладья (r): 5 очков
- Ферзь (q): 9 очков
- Король (k): 0 очков (бесценен)

## Основные функции

### `getCapturedPiecesForClient(chess, clientSide)`
Возвращает съеденные фигуры для конкретного клиента.
- `chess`: экземпляр Chess
- `clientSide`: 1 для белых, 2 для черных

### `getAllCapturedPieces(chess)`
Возвращает полный анализ съеденных фигур для обеих сторон.

### `formatCapturedPieces(capturedPieces)`
Форматирует съеденные фигуры для отображения: "♟ ♞ ♜ (9 points)"

### `formatCapturedPiecesCompact(pieces)`
Компактное форматирование: "2♟ 1♞ 1♜"

### `getPieceSymbol(piece)`
Возвращает Unicode символ для фигуры.

## Пример использования в UI

```typescript
// Для отображения над доской (съеденные белыми)
const whiteCaptured = getCapturedPiecesForClient(chess, 1);
const compactDisplay = formatCapturedPiecesCompact(whiteCaptured.pieces);
// Результат: "2♟ 1♞" - 2 пешки и 1 конь

// Для отображения под доской (съеденные черными)
const blackCaptured = getCapturedPiecesForClient(chess, 2);
const fullDisplay = formatCapturedPieces(blackCaptured);
// Результат: "♙ ♗ (4 points)" - пешка и слон, 4 очка
```

## Интеграция с игровым движком

Функция автоматически определяет съеденные фигуры, сравнивая текущее состояние доски с начальной расстановкой. Фигуры сортируются по ценности от меньших к большим для удобной визуализации.
