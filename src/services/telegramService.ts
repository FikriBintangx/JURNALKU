/**
 * Telegram Alert Service
 * 
 * Sends notifications to the developer's Telegram bot when:
 * - API traffic is high
 * - All AI keys are rate-limited (Emergency)
 * - Critical errors occur
 */

const TELEGRAM_API_URL = 'https://api.telegram.org/bot';

// Prevent spamming — only send similar alerts once every 5 minutes
const alertHistory: Record<string, number> = {};
const ALERT_COOLDOWN_MS = 5 * 60 * 1000;

export async function sendTelegramAlert(message: string, alertType: string = 'general'): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    // console.warn('[TELEGRAM] Bot token or Chat ID missing. Alert skipped.');
    return;
  }

  const now = Date.now();
  if (alertHistory[alertType] && now - alertHistory[alertType] < ALERT_COOLDOWN_MS) {
    return;
  }

  try {
    const response = await fetch(`${TELEGRAM_API_URL}${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `⚠️ [JURNALSTAR ALERT]\n\n${message}\n\n🕒 ${new Date().toLocaleString('id-ID')}`,
        parse_mode: 'Markdown',
      }),
    });

    if (response.ok) {
      alertHistory[alertType] = now;
      console.log(`[TELEGRAM] Alert sent: ${alertType}`);
    } else {
      console.error('[TELEGRAM] Failed to send alert:', await response.text());
    }
  } catch (error: any) {
    console.error('[TELEGRAM] Error sending alert:', error.message);
  }
}
