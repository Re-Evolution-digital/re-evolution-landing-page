import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'production',
  },
});

const signature = `
<table cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; color: #333; line-height: 1.4; min-width: 450px;">
  <tr>
    <td style="padding-right: 20px; border-right: 2px solid #FFCB05; vertical-align: middle; width: 120px;">
      <img src="https://lh3.googleusercontent.com/d/13i8Vqpa9imGafUywK7o06rb6yc2jQMd1" alt="Re-Evolution Logo" width="100" style="display: block; border: 0;">
    </td>
    <td style="padding-left: 20px; vertical-align: middle;">
      <div style="font-size: 16px; font-weight: bold; color: #008DFF; margin-bottom: 2px;">Geral</div>
      <div style="font-size: 13px; color: #666; margin-bottom: 10px; font-style: italic;">A Equipa da Re-Evolution</div>
      <div style="font-size: 12px; color: #444;">
        <span style="color: #008DFF; font-weight: bold;">T.</span> <a href="tel:+351969063633" style="color: #333; text-decoration: none;">+351 969 063 633</a><br>
        <span style="color: #008DFF; font-weight: bold;">W.</span> <a href="https://www.re-evolution.pt" target="_blank" style="color: #333; text-decoration: none;">www.re-evolution.pt</a><br>
        <span style="color: #008DFF; font-weight: bold;">A.</span> Pct. José Régio nº 5, 2ºDto, 2790-092 Carnaxide
      </div>
      <div style="margin-top: 10px; font-weight: bold; font-size: 12px; color: #222; text-transform: uppercase; letter-spacing: 0.5px;">
        Re-Evolution, Digital Services
      </div>
    </td>
  </tr>
  <tr>
    <td colspan="2" style="padding-top: 15px;">
      <div style="display: inline-block; background-color: #25D366; padding: 8px 15px; border-radius: 4px;">
        <a href="https://wa.me/351969063633?text=Ol%C3%A1!%20Gostaria%20de%20agendar%20uma%20reuni%C3%A3o%20de%20diagn%C3%B3stico." target="_blank" style="font-size: 12px; color: #ffffff; text-decoration: none; font-weight: bold;">
          <img src="https://cdn-icons-png.flaticon.com/16/733/733585.png" width="14" style="vertical-align: middle; margin-right: 5px;">
          Fale comigo por WhatsApp
        </a>
      </div>
    </td>
  </tr>
</table>
<div style="margin-top: 20px; font-size: 10px; color: #999; max-width: 500px; line-height: 1.2; border-top: 1px solid #eee; padding-top: 10px;">
  Esta mensagem e quaisquer ficheiros anexos são confidenciais e destinados exclusivamente ao uso da pessoa ou entidade a quem são dirigidos. Se recebeu esta mensagem por erro, por favor notifique o remetente.
</div>`;

function buildEmailHtml(name: string, locale: string): string {
  const isEn = locale === 'en';

  const greeting = isEn
    ? `<p>Dear <strong>${name}</strong>,</p>`
    : `<p>Olá <strong>${name}</strong>,</p>`;

  const body = isEn
    ? `<p>Thank you for requesting your free diagnostic. We have received your information and our team will review your situation carefully.</p>
       <p>We will get back to you within <strong>24 business hours</strong>.</p>
       <p>In the meantime, if you have any questions feel free to contact us directly via WhatsApp or phone.</p>`
    : `<p>Obrigado por solicitares o teu diagnóstico gratuito. Recebemos as tuas informações e a nossa equipa irá analisar a tua situação com atenção.</p>
       <p>Entraremos em contacto contigo em menos de <strong>24 horas úteis</strong>.</p>
       <p>Enquanto isso, se tiveres alguma dúvida podes contactar-nos diretamente via WhatsApp ou telefone.</p>`;

  const subject = isEn ? 'Diagnosis received — Re-Evolution' : 'Diagnóstico recebido — Re-Evolution';

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 30px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #061f5c, #0a3590); padding: 30px 40px; text-align: center;">
                  <img src="https://lh3.googleusercontent.com/d/13i8Vqpa9imGafUywK7o06rb6yc2jQMd1" alt="Re-Evolution" width="80" style="display: inline-block;">
                  <div style="color: #FFCB05; font-size: 12px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; margin-top: 10px;">
                    ${isEn ? 'Digital Transformation' : 'Transformação Digital'}
                  </div>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding: 40px; color: #333; font-size: 15px; line-height: 1.7;">
                  ${greeting}
                  ${body}
                  <p style="color: #999; font-size: 13px;">${isEn ? 'Best regards,' : 'Com os melhores cumprimentos,'}</p>
                  <br>
                  ${signature}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>`;

  return JSON.stringify({ subject, html });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, businessType, challenge, budget, urgency, locale } = body;
    const lang = locale ?? 'pt';

    // 1. Google Sheets
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const timestamp = new Date().toLocaleString('pt-PT', { timeZone: 'Europe/Lisbon' });

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'Sheet1!A:I',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[timestamp, name, email, phone, businessType, challenge, budget, urgency, lang]],
      },
    });

    // 2. Telegram
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const telegramMessage = `🔔 <b>Novo Lead — Re-Evolution</b>\n\n👤 <b>Nome:</b> ${esc(name)}\n📧 <b>Email:</b> ${esc(email)}\n📱 <b>Telefone:</b> ${esc(phone)}\n🏢 <b>Negócio:</b> ${esc(businessType)}\n💬 <b>Desafio:</b> ${esc(challenge)}\n💰 <b>Orçamento:</b> ${esc(budget)}\n⚡ <b>Urgência:</b> ${esc(urgency)}\n🌐 <b>Idioma:</b> ${esc(lang)}`;

    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: telegramMessage,
        parse_mode: 'HTML',
      }),
    });

    // 3. Confirmation email to client
    const { subject, html } = JSON.parse(buildEmailHtml(name, lang));

    await transporter.sendMail({
      from: `"Re-Evolution" <${process.env.SMTP_USER}>`,
      to: email,
      bcc: process.env.SMTP_USER,
      subject,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Submit form error:', error);
    return NextResponse.json({ success: false, error: 'Erro ao guardar dados' }, { status: 500 });
  }
}
