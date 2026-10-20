// Thank-you email for new guest list sign-ups, sent through Resend.
// Skips quietly if RESEND_API_KEY is not set, so the sign-up itself never fails because of email.
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function welcomeEmail(first) {
  const name = esc(first);
  const subject = "You're on the Dock guest list";
  const text = `Hi ${first},

Thank you for joining the Dock guest list.

Dock gathers people by the water and gives them a reason to stay. You'll hear about every gathering before anyone else.

While you wait, read Stories from these waters, our history series on the Chesapeake:
https://thedock.life/stories/

Come to the water. Know its story. Stay a while.

Dock
hello@thedock.life
instagram.com/thedock.life

You're getting this because you joined the guest list at thedock.life. If that wasn't you, reply and we'll take you off.`;
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#F6F1E8">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F1E8"><tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFDF8;border:1px solid #E2DBCD;border-radius:8px">
<tr><td align="center" style="padding:40px 36px 8px"><img src="https://thedock.life/assets/email-wave.png" width="120" height="48" alt="Dock" style="display:block;border:0"></td></tr>
<tr><td style="padding:24px 36px 8px;font-family:Georgia,'Times New Roman',serif;color:#14253F;font-size:18px;line-height:1.6">
<p style="margin:0 0 16px">Hi ${name},</p>
<p style="margin:0 0 16px">Thank you for joining the Dock guest list.</p>
<p style="margin:0 0 16px">Dock gathers people by the water and gives them a reason to stay. You'll hear about every gathering before anyone else.</p>
<p style="margin:0 0 24px">While you wait, read <i>Stories from these waters</i>, our history series on the Chesapeake.</p>
</td></tr>
<tr><td align="center" style="padding:0 36px 28px"><a href="https://thedock.life/stories/" style="display:inline-block;background:#14253F;color:#FBF8F2;text-decoration:none;font-family:'Courier New',monospace;font-size:12px;letter-spacing:3px;text-transform:uppercase;padding:14px 24px;border-radius:999px">Read the stories</a></td></tr>
<tr><td align="center" style="padding:8px 36px 36px;font-family:Georgia,'Times New Roman',serif;font-style:italic;color:#24324A;font-size:19px;line-height:1.5">Come to the water. Know its story. Stay a while.</td></tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px"><tr><td align="center" style="padding:20px 24px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:1px;color:#7A8597;line-height:1.7">
<a href="mailto:hello@thedock.life" style="color:#7A8597">hello@thedock.life</a> &nbsp;·&nbsp; <a href="https://instagram.com/thedock.life" style="color:#7A8597">@thedock.life</a><br>
You're getting this because you joined the guest list at thedock.life.<br>If that wasn't you, reply and we'll take you off.
</td></tr></table>
</td></tr></table></body></html>`;
  return { subject, text, html };
}

export async function sendWelcome(env, to, first) {
  if (!env.RESEND_API_KEY) return;
  const { subject, text, html } = welcomeEmail(first);
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY.trim()}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: 'Dock <hello@thedock.life>', to: [to], reply_to: 'hello@thedock.life', subject, text, html }),
    });
  } catch (e) { /* the sign-up is already saved; a failed email is not worth failing the request */ }
}
