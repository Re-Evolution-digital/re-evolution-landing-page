import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const webhookUrl = process.env.MAKE_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json({ error: 'MAKE_WEBHOOK_URL not configured' }, { status: 500 });
  }

  const leadPayload = {
    name: body.name ?? 'não mencionado',
    contact: body.contact ?? 'não mencionado',
    business_type: body.business_type ?? 'não mencionado',
    current_situation: body.current_situation ?? 'não mencionado',
    main_need: body.main_need ?? 'não mencionado',
    urgency: body.urgency ?? 'não mencionado',
    budget: body.budget ?? 'não mencionado',
    decision_maker: body.decision_maker ?? 'não mencionado',
    timestamp: new Date().toISOString(),
    source: 'chatbot',
  };

  const [makeResult, telegramResult] = await Promise.allSettled([
    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadPayload),
      signal: AbortSignal.timeout(5_000),
    }),
    sendTelegramNotification(leadPayload),
  ]);

  if (makeResult.status === 'rejected') {
    console.error('Make.com webhook failed:', makeResult.reason);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 502 });
  }

  if (telegramResult.status === 'rejected') {
    console.error('Telegram notification failed:', telegramResult.reason);
  }

  return NextResponse.json({ ok: true });
}

async function sendTelegramNotification(lead: Record<string, string>) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const msg = [
    '🤖 *Novo Lead — Fala Barato*',
    '',
    `👤 *Nome:* ${lead.name}`,
    `📞 *Contacto:* ${lead.contact}`,
    `🏢 *Negócio:* ${lead.business_type}`,
    `📋 *Situação:* ${lead.current_situation}`,
    `🎯 *Necessidade:* ${lead.main_need}`,
    `⏰ *Urgência:* ${lead.urgency}`,
    `💰 *Orçamento:* ${lead.budget}`,
    `✅ *Decisor:* ${lead.decision_maker}`,
  ].join('\n');

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' }),
    signal: AbortSignal.timeout(5_000),
  });
}
