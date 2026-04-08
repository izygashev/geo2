import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "Geo Studio <noreply@geo-saas.com>";

interface ReportReadyEmailParams {
  to: string;
  userName: string;
  projectName: string;
  reportUrl: string;
  score: number | null;
  status: "COMPLETED" | "FAILED";
}

export async function sendReportReadyEmail(params: ReportReadyEmailParams) {
  if (!resend) {
    console.log("⚠️ RESEND_API_KEY not set — skipping email notification");
    return;
  }

  const { to, userName, projectName, reportUrl, score, status } = params;

  const isSuccess = status === "COMPLETED";
  const subject = isSuccess
    ? `✅ Отчёт для ${projectName} готов — Score ${score ?? "N/A"}/100`
    : `❌ Ошибка отчёта для ${projectName}`;

  const html = isSuccess
    ? `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F7F6F3; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; border: 1px solid #EAEAEA; padding: 32px;">
    <h2 style="color: #1a1a1a; font-size: 16px; margin: 0 0 8px;">Привет, ${userName}!</h2>
    <p style="color: #787774; font-size: 14px; margin: 0 0 24px;">
      Отчёт по AI-видимости для <strong>${projectName}</strong> готов.
    </p>
    <div style="background: #F7F6F3; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px;">
      <p style="color: #787774; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 8px;">Overall Score</p>
      <p style="color: #1a1a1a; font-size: 36px; font-weight: bold; margin: 0;">${score ?? "—"}<span style="color: #BBBBBB; font-size: 14px;">/100</span></p>
    </div>
    <a href="${reportUrl}" style="display: block; text-align: center; background: #111; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
      Открыть отчёт →
    </a>
    <p style="color: #BBBBBB; font-size: 12px; margin: 24px 0 0; text-align: center;">
      Geo Studio — AI-видимость вашего сайта
    </p>
  </div>
</body>
</html>`
    : `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F7F6F3; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; border: 1px solid #EAEAEA; padding: 32px;">
    <h2 style="color: #1a1a1a; font-size: 16px; margin: 0 0 8px;">Привет, ${userName}!</h2>
    <p style="color: #787774; font-size: 14px; margin: 0 0 24px;">
      К сожалению, при генерации отчёта для <strong>${projectName}</strong> произошла ошибка.
    </p>
    <p style="color: #787774; font-size: 14px; margin: 0 0 24px;">
      Вы можете повторить анализ из панели управления.
    </p>
    <a href="${reportUrl}" style="display: block; text-align: center; background: #111; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
      Перейти к отчёту →
    </a>
    <p style="color: #BBBBBB; font-size: 12px; margin: 24px 0 0; text-align: center;">
      Geo Studio — AI-видимость вашего сайта
    </p>
  </div>
</body>
</html>`;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent to ${to} — ${subject}`);
  } catch (error) {
    console.error("Failed to send email:", error);
  }
}
