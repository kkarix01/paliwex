/**
 * Paliwex — odbiornik formularza "Zapytaj o ofertę" (Google Apps Script)
 *
 * Zapisuje zapytanie w Arkuszu Google i wysyła powiadomienie e-mail.
 * Skrypt powinien być powiązany z arkuszem (Arkusz → Rozszerzenia → Apps Script).
 * Instrukcja wdrożenia: README.md, sekcja 3.
 *
 * Właściwości skryptu (Ustawienia projektu → Właściwości skryptu):
 *   NOTIFY_EMAIL  – adres(y) odbiorcy powiadomień, np. "biuro@firma.pl" lub "a@x.pl,b@y.pl"
 * Ten plik nie zawiera haseł ani kluczy — można go trzymać w repozytorium.
 */

const SHEET_NAME = 'Zapytania';
const MIN_FILL_TIME_MS = 3000;          // szybciej wypełniony formularz = bot
const GLOBAL_LIMIT_PER_10_MIN = 30;     // ochrona limitów Gmaila przed zalewem
const PER_EMAIL_LIMIT_PER_10_MIN = 3;

const FIELDS = {
  name:     { label: 'Imię i nazwisko', required: true, max: 120 },
  company:  { label: 'Firma / gospodarstwo', max: 160 },
  phone:    { label: 'Telefon', required: true, max: 30 },
  email:    { label: 'E-mail', required: true, max: 160 },
  product:  { label: 'Produkt', required: true, max: 80 },
  quantity: { label: 'Szacowana ilość', max: 80 },
  location: { label: 'Miejscowość dostawy', max: 120 },
  message:  { label: 'Wiadomość', max: 3000 },
};

function doPost(e) {
  try {
    const p = (e && e.parameter) || {};

    if (p.website) return json_({ ok: false, error: 'rejected' });                       // honeypot
    if (Number(p.elapsed_ms || 0) < MIN_FILL_TIME_MS) return json_({ ok: false, error: 'too_fast' });
    if (p.consent !== 'tak') return json_({ ok: false, error: 'consent_required' });

    const data = {};
    for (const key in FIELDS) {
      const value = String(p[key] || '').trim().slice(0, FIELDS[key].max);
      if (FIELDS[key].required && !value) return json_({ ok: false, error: 'missing_' + key });
      data[key] = value;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return json_({ ok: false, error: 'invalid_email' });
    if (!/^[0-9+()\s-]{9,}$/.test(data.phone)) return json_({ ok: false, error: 'invalid_phone' });

    if (!withinRateLimit_(data.email)) return json_({ ok: false, error: 'rate_limited' });

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      appendRow_(data, p.page);
    } finally {
      lock.releaseLock();
    }

    sendNotification_(data);
    return json_({ ok: true });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'server_error' });
  }
}

/** Test w przeglądarce: otwórz adres /exec — powinno pokazać {"ok":true,"status":"ready"} */
function doGet() {
  return json_({ ok: true, status: 'ready' });
}

function appendRow_(data, page) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Data', ...Object.keys(FIELDS).map((k) => FIELDS[k].label), 'Strona', 'Zgoda']);
    sheet.setFrozenRows(1);
  }
  sheet.appendRow([new Date(), ...Object.keys(FIELDS).map((k) => safeCell_(data[k])), safeCell_(page || ''), 'tak']);
}

function sendNotification_(data) {
  const to = PropertiesService.getScriptProperties().getProperty('NOTIFY_EMAIL');
  if (!to) throw new Error('Brak właściwości NOTIFY_EMAIL');
  const body = Object.keys(FIELDS)
    .map((k) => `${FIELDS[k].label}: ${data[k] || '—'}`)
    .join('\n');
  MailApp.sendEmail({
    to: to,
    replyTo: data.email,
    subject: `Zapytanie ofertowe: ${data.product} – ${data.name}`,
    body: `Nowe zapytanie ze strony paliwex.pl\n\n${body}\n`,
  });
}

function withinRateLimit_(email) {
  const cache = CacheService.getScriptCache();
  const bump = (key, limit) => {
    const count = Number(cache.get(key) || 0);
    if (count >= limit) return false;
    cache.put(key, String(count + 1), 600);
    return true;
  };
  return bump('global', GLOBAL_LIMIT_PER_10_MIN) && bump('email:' + email.toLowerCase(), PER_EMAIL_LIMIT_PER_10_MIN);
}

/** Chroni arkusz przed wstrzyknięciem formuł (=, +, -, @ na początku komórki). */
function safeCell_(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
