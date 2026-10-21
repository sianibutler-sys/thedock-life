// Welcome text for guest list sign-ups who ticked "Text me about gatherings", sent through Twilio.
// Skips quietly unless TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_FROM are all set.
// Twilio handles STOP replies itself and will not text anyone who has opted out.
export function toE164(raw) {
  const d = String(raw || '').replace(/\D/g, '');
  if (d.length === 10) return '+1' + d;
  if (d.length === 11 && d.startsWith('1')) return '+' + d;
  return null; // US numbers only for now
}

export async function sendWelcomeText(env, phone, first) {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM) return;
  const to = toE164(phone);
  if (!to) return;
  const name = String(first || '').replace(/[^\p{L}\p{N} '\-.]/gu, '').slice(0, 40);
  const body = `Dock: Thanks for joining the guest list${name ? ', ' + name : ''}. We'll text when a gathering opens. Reply STOP to opt out.`;
  const sid = env.TWILIO_ACCOUNT_SID.trim();
  const form = new URLSearchParams({ To: to, Body: body });
  const from = env.TWILIO_FROM.trim();
  if (from.startsWith('MG')) form.set('MessagingServiceSid', from); else form.set('From', from);
  try {
    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: { authorization: 'Basic ' + btoa(`${sid}:${env.TWILIO_AUTH_TOKEN.trim()}`), 'content-type': 'application/x-www-form-urlencoded' },
      body: form,
    });
  } catch (e) { /* the sign-up is already saved */ }
}
