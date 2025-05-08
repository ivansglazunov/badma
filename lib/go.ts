import jsChessEngine from 'js-chess-engine';

/**
 * Возвращает лучший ход для заданной позиции FEN и уровня сложности.
 * @param {string} fen - Строка позиции в формате FEN.
 * @param {number} level - Уровень сложности (0-4).
 * @returns {{from: string, to: string, promotion: string|null}}
 */
export function go(fen: string, level: number) {
    // Получаем ход от движка: например { "E2": "E4" }
    const moveObj = jsChessEngine.aiMove(fen, level);

    // Извлекаем from и to
    const from = Object.keys(moveObj)[0];
    const to = moveObj[from];

    // В js-chess-engine пешка всегда превращается в ферзя автоматически,
    // но движок не возвращает тип превращения явно.
    // Поэтому promotion укажем только если ход пешкой на последнюю горизонталь.
    let promotion: any = null;
    // Проверяем: если from - пешка и to - 1 или 8 горизонталь, то promotion = 'q'
    const fromRank = from[1];
    const toRank = to[1];
    if ((fromRank === '7' && toRank === '8') || (fromRank === '2' && toRank === '1')) {
        promotion = 'q';
    }

    return { from, to, promotion };
}

