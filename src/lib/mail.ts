import nodemailer from "nodemailer";
import { render } from "@react-email/components";
import WelcomeEmail from "@/emails/WelcomeEmail";
import VerificationEmail from "@/emails/VerificationEmail";
import ResetPasswordEmail from "@/emails/ResetPasswordEmail";
import TransactionEmail from "@/emails/TransactionEmail";

/* ─── Transporter (lazy singleton) ─── */

let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (_transporter) return _transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP not configured — set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS env vars"
    );
  }

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return _transporter;
}

const FROM = process.env.EMAIL_FROM ?? "Geo Studio <noreply@geostudioai.ru>";

/* ─── Helpers ─── */

async function send(to: string, subject: string, html: string) {
  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({ from: FROM, to, subject, html });
    console.log(`📧 Email sent to ${to} — ${subject} (${info.messageId})`);
    return info;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
    throw error;
  }
}

/* ─── Public API ─── */

/**
 * Welcome email — sent after successful registration.
 */
export async function sendWelcomeEmail(to: string, name?: string) {
  const html = await render(WelcomeEmail({ name }));
  return send(to, "Добро пожаловать в Geo Studio", html);
}

/**
 * Email verification — sends a tokenised URL for the user to confirm.
 */
export async function sendVerificationEmail(
  to: string,
  tokenUrl: string,
  name?: string
) {
  const html = await render(
    VerificationEmail({ name, verificationUrl: tokenUrl })
  );
  return send(to, "Подтверждение email-адреса — Geo Studio", html);
}

/**
 * Password reset — sends a time-limited reset link.
 */
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  name?: string
) {
  const html = await render(ResetPasswordEmail({ name, resetUrl }));
  return send(to, "Восстановление пароля — Geo Studio", html);
}

/**
 * Transaction receipt — sent after a successful payment.
 */
export interface TransactionReceiptData {
  name?: string;
  planName: string;
  amount: string;
  date: string;
}

export async function sendTransactionReceipt(
  to: string,
  data: TransactionReceiptData
) {
  const html = await render(
    TransactionEmail({
      name: data.name,
      planName: data.planName,
      amount: data.amount,
      date: data.date,
    })
  );
  return send(to, `Чек об оплате — ${data.planName} — Geo Studio`, html);
}
