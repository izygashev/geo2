/**
 * Telegram Alert Service — уведомления основателю через Telegram Bot API.
 *
 * Env:
 *   TELEGRAM_BOT_TOKEN — токен бота (@BotFather)
 *   TELEGRAM_CHAT_ID   — ID чата / пользователя для отправки
 *   HTTPS_PROXY / HTTP_PROXY — (опционально) HTTP-прокси для Node.js
 *
 * Автоматически подхватывает системный прокси Windows если задан.
 * Никогда не бросает исключения — ошибки логируются в консоль.
 */

import https from "node:https";
import http from "node:http";
import { URL } from "node:url";

const TELEGRAM_API = "https://api.telegram.org";

export async function sendTelegramAlert(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("[Telegram] ⚠️ TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID не заданы — алерт пропущен");
    return;
  }

  const payload = JSON.stringify({
    chat_id: chatId,
    text: message,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  });

  const apiUrl = `${TELEGRAM_API}/bot${token}/sendMessage`;

  try {
    // Пробуем через прокси, если настроен
    const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.https_proxy || process.env.http_proxy;

    if (proxyUrl) {
      await sendViaProxy(apiUrl, payload, proxyUrl);
    } else {
      // Без прокси — обычный https.request с таймаутом
      await sendDirect(apiUrl, payload);
    }
  } catch (err) {
    console.error("[Telegram] ❌ Ошибка отправки:", err);
  }
}

/** Прямая отправка через https.request */
function sendDirect(apiUrl: string, payload: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(apiUrl);
    const req = https.request(
      {
        hostname: parsed.hostname,
        port: 443,
        path: parsed.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
        timeout: 15_000,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk: Buffer) => (body += chunk.toString()));
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve();
          } else {
            console.error(`[Telegram] ❌ API вернул ${res.statusCode}: ${body}`);
            resolve(); // не бросаем — не крашим приложение
          }
        });
      }
    );
    req.on("timeout", () => { req.destroy(); reject(new Error("Timeout 15s")); });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

/** Отправка через HTTP-прокси (forward proxy) */
function sendViaProxy(apiUrl: string, payload: string, proxyUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proxy = new URL(proxyUrl);

    // Forward proxy — отправляем полный URL как path через HTTP к прокси
    const req = http.request(
      {
        host: proxy.hostname,
        port: Number(proxy.port) || 1080,
        method: "POST",
        path: apiUrl, // полный URL — прокси сам пробросит
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
          Host: new URL(apiUrl).hostname,
        },
        timeout: 15_000,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk: Buffer) => (body += chunk.toString()));
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve();
          } else {
            // Прокси вернул ошибку — пробуем CONNECT-метод
            console.warn(`[Telegram] Forward proxy вернул ${res.statusCode}, пробую CONNECT...`);
            sendViaConnect(apiUrl, payload, proxyUrl).then(resolve).catch(reject);
          }
        });
      }
    );
    req.on("timeout", () => { req.destroy(); reject(new Error("Proxy timeout 15s")); });
    req.on("error", (err) => {
      console.warn(`[Telegram] Forward proxy ошибка: ${err.message}, пробую CONNECT...`);
      sendViaConnect(apiUrl, payload, proxyUrl).then(resolve).catch(reject);
    });
    req.write(payload);
    req.end();
  });
}

/** Отправка через HTTP CONNECT-прокси (для HTTPS через HTTP tunnel) */
function sendViaConnect(apiUrl: string, payload: string, proxyUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proxy = new URL(proxyUrl);
    const target = new URL(apiUrl);

    const connectReq = http.request({
      host: proxy.hostname,
      port: Number(proxy.port) || 1080,
      method: "CONNECT",
      path: `${target.hostname}:443`,
      timeout: 15_000,
    });

    connectReq.on("connect", (_res, socket) => {
      const agent = new https.Agent({ keepAlive: false });
      (agent as any).createConnection = () => socket;

      const req = https.request(
        {
          hostname: target.hostname,
          path: target.pathname,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload),
          },
          agent,
          timeout: 15_000,
        },
        (res) => {
          let body = "";
          res.on("data", (chunk: Buffer) => (body += chunk.toString()));
          res.on("end", () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve();
            } else {
              console.error(`[Telegram] ❌ API вернул ${res.statusCode}: ${body}`);
              resolve();
            }
          });
        }
      );
      req.on("timeout", () => { req.destroy(); reject(new Error("Timeout 15s (proxy)")); });
      req.on("error", reject);
      req.write(payload);
      req.end();
    });

    connectReq.on("timeout", () => { connectReq.destroy(); reject(new Error("Proxy connect timeout")); });
    connectReq.on("error", reject);
    connectReq.end();
  });
}

/**
 * Форматирует алерт о падении BullMQ-джоба.
 */
export function formatJobFailedAlert(
  jobId: string | undefined,
  jobName: string | undefined,
  error: Error,
  attemptsMade?: number,
  maxAttempts?: number,
): string {
  const isFinal = attemptsMade != null && maxAttempts != null && attemptsMade >= maxAttempts;
  const statusEmoji = isFinal ? "🔴" : "🟡";
  const statusText = isFinal ? "ОКОНЧАТЕЛЬНЫЙ ПРОВАЛ" : "RETRY";

  return [
    `${statusEmoji} <b>Job Failed — ${statusText}</b>`,
    ``,
    `<b>Job ID:</b> <code>${jobId ?? "unknown"}</code>`,
    `<b>Job Name:</b> ${jobName ?? "report-generation"}`,
    `<b>Попытка:</b> ${attemptsMade ?? "?"} / ${maxAttempts ?? "?"}`,
    `<b>Ошибка:</b> <code>${escapeHtml(error.message).slice(0, 500)}</code>`,
    ``,
    `<i>${new Date().toLocaleString("ru-RU", { timeZone: "Europe/Moscow" })}</i>`,
  ].join("\n");
}

/**
 * Форматирует алерт о зависшем (stalled) джобе.
 */
export function formatJobStalledAlert(jobId: string): string {
  return [
    `⚠️ <b>Job Stalled</b>`,
    ``,
    `<b>Job ID:</b> <code>${jobId}</code>`,
    `Джоб завис и будет перезапущен BullMQ.`,
    `Возможные причины: Playwright OOM, зависание сети, нехватка RAM.`,
    ``,
    `<i>${new Date().toLocaleString("ru-RU", { timeZone: "Europe/Moscow" })}</i>`,
  ].join("\n");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
