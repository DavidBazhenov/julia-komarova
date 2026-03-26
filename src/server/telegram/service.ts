import { getOptionalEnv } from '../config/env';
import { sendTelegramMessage } from './client';

function looksLikeTelegramBotToken(token: string): boolean {
  return /^\d+:[A-Za-z0-9_-]{20,}$/.test(token);
}

function looksLikePlaceholder(value: string): boolean {
  const normalized = value.trim().toLowerCase();

  return (
    normalized.length === 0 ||
    normalized.includes('replace-with') ||
    normalized.includes('placeholder') ||
    normalized.includes('example') ||
    normalized.startsWith('your-') ||
    normalized === '123456'
  );
}

export async function notifyTelegram(text: string): Promise<void> {
  const token = getOptionalEnv('TELEGRAM_BOT_TOKEN').trim();
  const chatId = getOptionalEnv('TELEGRAM_CHAT_ID').trim();

  if (!looksLikeTelegramBotToken(token) || looksLikePlaceholder(chatId)) {
    return;
  }

  try {
    await sendTelegramMessage(token, { chatId, text, parseMode: 'HTML' });
  } catch {
    // Telegram is best-effort; inquiry persistence must not fail here.
  }
}
