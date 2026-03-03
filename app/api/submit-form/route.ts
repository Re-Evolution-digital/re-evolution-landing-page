import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, businessType, challenge, budget, urgency, locale } = body;

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
        values: [[timestamp, name, email, phone, businessType, challenge, budget, urgency, locale ?? 'pt']],
      },
    });

    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const message = `🔔 <b>Novo Lead — Re-Evolution</b>\n\n👤 <b>Nome:</b> ${esc(name)}\n📧 <b>Email:</b> ${esc(email)}\n📱 <b>Telefone:</b> ${esc(phone)}\n🏢 <b>Negócio:</b> ${esc(businessType)}\n💬 <b>Desafio:</b> ${esc(challenge)}\n💰 <b>Orçamento:</b> ${esc(budget)}\n⚡ <b>Urgência:</b> ${esc(urgency)}\n🌐 <b>Idioma:</b> ${esc(locale ?? 'pt')}`;

    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Submit form error:', error);
    return NextResponse.json({ success: false, error: 'Erro ao guardar dados' }, { status: 500 });
  }
}
