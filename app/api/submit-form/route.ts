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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Google Sheets error:', error);
    return NextResponse.json({ success: false, error: 'Erro ao guardar dados' }, { status: 500 });
  }
}
