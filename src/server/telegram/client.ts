export type TelegramMessagePayload = {
  chatId: string;
  text: string;
  parseMode?: 'HTML' | 'MarkdownV2';
};

export async function sendTelegramMessage(token: string, payload: TelegramMessagePayload): Promise<void> {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: payload.chatId,
      text: payload.text,
      parse_mode: payload.parseMode,
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Telegram request failed with status ${response.status}`);
  }
}
