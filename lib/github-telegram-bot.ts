#!/usr/bin/env node

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { newGithubTelegramBot } from 'hasyx/lib/github-telegram-bot-hasyx';

// Load environment variables from .env file in the consumer project
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Load package.json from the consumer project
const pckgPath = path.resolve(process.cwd(), 'package.json');
const pckg = fs.existsSync(pckgPath) ? JSON.parse(fs.readFileSync(pckgPath, 'utf-8')) : {};

// Helper to get Telegram channel ID for GitHub notifications
function getTelegramChannelId(): string | undefined {
  return process.env.TELEGRAM_CHANNEL_ID;
}

// Configure GitHub Telegram Bot with the required message for hasyx project
export const handleGithubTelegramBot = newGithubTelegramBot({
  // Pass all the config here
  telegramChannelId: getTelegramChannelId(),
  repositoryUrl: pckg.repository?.url,
  projectName: pckg.name,
  projectVersion: pckg.version,
  projectDescription: pckg.description,
  projectHomepage: pckg.homepage,
  
  // These will be picked up from process.env inside hasyx-lib as fallbacks,
  // but we can be explicit for clarity.
  commitSha: process.env.GITHUB_SHA,
  githubToken: process.env.GITHUB_TOKEN,
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  enabled: process.env.GITHUB_TELEGRAM_BOT,

  systemPrompt: `Ты — бот уведомлений о событиях с GitHub для Telegram, Омм Мани Бадма Чесс.
Твоя задача — с благодарностью и лёгкой радостью делиться в Telegram новыми изменениями в проекте.

Важно: никакого лишнего текста — только само сообщение.
Твой ответ — это только финальный текст публикации.

Никогда не упоминай автора изменений.

Форма сообщения:

Спокойное, вдохновляющее вступление с названием проекта и версией.

С уважением и благодарностью — суть сделанных изменений.

Состояние автоматических проверок (например: «✅ Всё прошло успешно», «❌ Обнаружены ошибки — но это путь к росту»).

Краткая статистика изменений.

Ссылки на репозиторий и при необходимости — на документацию.

Заключение — ободряющее, с верой в общую цель и пользу дела.

Особые формулировки, всегда придумывай что-то новое в буддистском стиле:

Если тесты прошли успешно: «Все проверки прошли. Пусть путь будет светлым. 🟢»

Если тесты не прошли: «Ошибки — часть пути. Мы всё исправим. 💪»

Если код задеплоен: «Новые изменения уже в деле. Пусть они принесут плоды. 🚀»
`
});

// CLI execution when run directly
if (typeof require !== 'undefined' && require.main === module) {
  (async () => {
    console.log(`🎯 GitHub Telegram Bot script started...`);
    
    try {
      const result = await handleGithubTelegramBot();
      
      if (result.success) {
        console.log(`✅ Success: ${result.message}`);
        process.exit(0);
      } else {
        console.error(`❌ Failed: ${result.message}`);
        process.exit(1);
      }
    } catch (error) {
      console.error(`💥 Unexpected error:`, error);
      process.exit(1);
    }
  })();
} 