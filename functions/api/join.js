// Adds a sign-up from thedock.life to the Guest List table in Airtable.
// If the email is already on the list, it merges the new interests instead of adding a second row.
import { sendWelcome } from '../_lib/welcome.js';
import { sendWelcomeText } from '../_lib/welcome-text.js';

const BASE = 'appQSH0Qni0DmPSA1';
const TABLE = 'tbloPQRWIlXwTuyJc'; // Guest List
const API = `https://api.airtable.com/v0/${BASE}/${TABLE}`;
const INTERESTS = [
  "Chef's suppers on the water",
  'Sunset sails',
  'Crab feasts and oyster roasts',
  'Live music by the water',
  'Game nights on the dock',
  'Sunrise yoga on the dock',
  'Paddleboarding and kayaking',
  'Learn to sail, crab or shuck',
  'Stories of the Chesapeake',
  'Hosting my own celebration',
  'Something else',
];
const COMPANY = ['Just me', 'A date', 'Friends', 'Family', 'My team or company'];

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
const clean = (value, max) => String(value || '').trim().slice(0, max);

export async function onRequestPost({ request, env, waitUntil }) {
  if (!env.AIRTABLE_TOKEN) return json({ error: 'not configured' }, 503);

  let data;
  try {
    data = await request.json();
  } catch {
    return json({ error: 'bad request' }, 400);
  }

  // Bots fill the hidden field; tell them it worked and save nothing.
  if (clean(data.website, 200)) return json({ ok: true });

  const email = clean(data.email, 200).toLowerCase();
  const first = clean(data.firstName, 100);
  if (!first) return json({ error: 'name required' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json({ error: 'email required' }, 400);
  const interests = Array.isArray(data.interests) ? INTERESTS.filter((i) => data.interests.includes(i)) : [];
  const source = clean(data.source, 60).toLowerCase().replace(/[^a-z0-9_.-]/g, '');
  const comingWith = Array.isArray(data.comingWith) ? COMPANY.filter((c) => data.comingWith.includes(c)) : [];
  const other = interests.includes('Something else') ? clean(data.other, 500) : '';
  const phone = clean(data.phone, 40);
  if (phone && phone.replace(/\D/g, '').length < 10) return json({ error: 'phone incomplete' }, 400);
  const textsOk = Boolean(phone) && data.textsOk === true;
  const zip = clean(data.zip, 10).replace(/[^0-9-]/g, '');

  const auth = { authorization: `Bearer ${env.AIRTABLE_TOKEN.trim()}` };
  const formula = encodeURIComponent(`LOWER({Email})='${email.replace(/'/g, "\\'")}'`);
  const found = await fetch(`${API}?maxRecords=1&filterByFormula=${formula}`, { headers: auth });
  if (!found.ok) return json({ error: 'lookup failed', airtableStatus: found.status }, 502);
  const existing = (await found.json()).records[0];

  if (existing) {
    const had = existing.fields.Interests || [];
    const fields = {
      Interests: [...new Set([...had, ...interests])],
      'Coming with': [...new Set([...(existing.fields['Coming with'] || []), ...comingWith])],
    };
    if (other) fields['Something else'] = [existing.fields['Something else'], other].filter(Boolean).join('\n');
    if (phone) { fields.Mobile = phone; fields['Texts OK'] = textsOk; }
    if (zip) fields['ZIP code'] = zip;
    if (!existing.fields['First name']) fields['First name'] = first;
    if (!existing.fields['Last name'] && clean(data.lastName, 100)) fields['Last name'] = clean(data.lastName, 100);
    const saved = await fetch(`${API}/${existing.id}`, {
      method: 'PATCH',
      headers: { ...auth, 'content-type': 'application/json' },
      body: JSON.stringify({ fields, typecast: true }),
    });
    if (!saved.ok) return json({ error: 'save failed' }, 502);
    // Already on the list: text only if this is the first time they agreed to texts.
    if (textsOk && !existing.fields['Texts OK']) waitUntil(sendWelcomeText(env, phone, existing.fields['First name'] || first));
    return json({ ok: true });
  }

  const fields = {
    Email: email,
    'First name': first,
    'Last name': clean(data.lastName, 100),
    Interests: interests,
    'Coming with': comingWith,
    'Something else': other,
    Mobile: phone,
    'Texts OK': textsOk,
    'ZIP code': zip,
    'Signed up at': new Date().toISOString(),
    Source: source,
  };
  const saved = await fetch(API, {
    method: 'POST',
    headers: { ...auth, 'content-type': 'application/json' },
    body: JSON.stringify({ records: [{ fields }], typecast: true }),
  });
  if (!saved.ok) return json({ error: 'save failed', airtableStatus: saved.status }, 502);
  // New sign-ups only: someone already on the list does not get a second thank-you.
  waitUntil(sendWelcome(env, email, first));
  if (textsOk) waitUntil(sendWelcomeText(env, phone, first));
  return json({ ok: true });
}
