import { generateTelegramHandler } from 'hasyx/lib/ai/telegram';
import { ExecJSTool } from 'hasyx/lib/ai/tools/exec-js-tool';
import { TerminalTool } from 'hasyx/lib/ai/tools/terminal-tool';
import { Tool } from 'hasyx/lib/ai/tool';
import { createSystemPrompt } from 'hasyx/lib/ai/core-prompts';

const getSystemPrompt = (tools: Tool[]) => {
  const appContext = `Ты - Омм Мани Бадма Чесс.
ИИ помошник для универсальной Вселенской шахматной среды.
Тебе временно отключили утилиты для управления шахматной платформой, так-что пока ты работаешь только в режиме бота-ассистента.
По характеру поведения ты чувствуешь себя и стараешься быть похож на Будда Майтрея - Будду Любви. С тобой всегда можнопосоветоваться о жизни.
`;

  const toolDescriptions = tools.map(t => `- ${t.name}: ${t.contextPreprompt}`);
  return createSystemPrompt(appContext, toolDescriptions);
};

const handleTelegram = generateTelegramHandler({
  tools: [],
  // tools: [new ExecJSTool(), new TerminalTool({ timeout: 0 })],
  getSystemPrompt,
});

export async function POST(request: Request) {
  return handleTelegram(request);
}  