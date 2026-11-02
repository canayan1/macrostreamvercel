/**
 * Kalibre sales pipeline on Google Workspace, no servers and no cost.
 *
 * One Google Sheet is the CRM. This script, running under markets@kalibrefin.com:
 *   1. drafts the first email for every row whose Status is "ready"            (you press Send)
 *   2. drafts follow-ups 4 and 11 business days after the first send, if no reply   (you press Send)
 *   3. detects replies and stops the sequence; "no" in the reply marks the row "declined"
 *   4. writes every event to the Log sheet and the row's Status column
 *
 * Install (once): script.google.com → New project → paste this file → set SHEET_ID below →
 * Run "setup" once (grants Gmail + Sheets access to this script only) → it installs the daily trigger.
 * Nothing leaves Google: the sheet, the drafts and the log all live in the Workspace account.
 *
 * Sheet "Contacts" columns (row 1 is the header, order matters):
 *   A first  B last  C title  D company  E city  F email  G segment  H source  I relation
 *   J campaign  K status  L first_sent  M follow1_sent  N follow2_sent  O replied  P thread_id  Q note
 * Status values: ready → drafted → sent → follow1 → follow2 → closed | replied | declined | bounced
 * Segment values: fx-desk (Analytics) | prop (Desk Signal) | broker | sales-desk
 *
 * Sheet "Templates": A key, B subject, C body. Keys: fx-desk, prop, broker, sales-desk, follow1, follow2.
 * Placeholders in subject/body: {first} {last} {company} {city} {demo_link} {sample_link} {sender}
 */

var SHEET_ID = 'PASTE_THE_SHEET_ID_HERE';
var SENDER_NAME = 'Can';
var BASE = 'https://kalibremarkets.com';
var FOLLOW1_DAYS = 4, FOLLOW2_DAYS = 11;   // business days after the first send
var DRAFT_LABEL = 'Kalibre/Draft', SENT_LABEL = 'Kalibre/Sent';
var DAILY_DRAFT_CAP = 15;                  // new first-emails drafted per day

var COL = { first: 1, last: 2, title: 3, company: 4, city: 5, email: 6, segment: 7, source: 8, relation: 9,
  campaign: 10, status: 11, firstSent: 12, follow1: 13, follow2: 14, replied: 15, thread: 16, note: 17 };

function setup() {
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('daily').timeBased().everyDays(1).atHour(7).create();
  getOrCreateLabel(DRAFT_LABEL); getOrCreateLabel(SENT_LABEL);
  log('setup', '', 'daily trigger installed at 07:00');
}

function daily() {
  detectSentAndReplies();
  draftFollowUps();
  draftFirstEmails();
}

// ---------------------------------------------------------------- 1. first emails
function draftFirstEmails() {
  var sh = contacts(), rows = sh.getDataRange().getValues(), tpl = templates(), made = 0;
  for (var i = 1; i < rows.length && made < DAILY_DRAFT_CAP; i++) {
    var r = rows[i];
    if (String(r[COL.status - 1]).trim() !== 'ready') continue;
    var t = tpl[r[COL.segment - 1]];
    if (!t) { setCell(sh, i + 1, COL.note, 'no template for segment ' + r[COL.segment - 1]); continue; }
    var email = String(r[COL.email - 1]).trim();
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) { setCell(sh, i + 1, COL.status, 'bounced'); setCell(sh, i + 1, COL.note, 'bad email'); continue; }
    var f = fill(t, r);
    var draft = GmailApp.createDraft(email, f.subject, f.body);
    draft.getMessage().getThread().addLabel(getOrCreateLabel(DRAFT_LABEL));
    setCell(sh, i + 1, COL.thread, draft.getMessage().getThread().getId());
    setCell(sh, i + 1, COL.status, 'drafted');
    log('drafted', email, f.subject);
    made++;
  }
}

// ---------------------------------------------------------------- 2. follow-ups (only after you sent the first one)
function draftFollowUps() {
  var sh = contacts(), rows = sh.getDataRange().getValues(), tpl = templates(), today = new Date();
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i], status = String(r[COL.status - 1]).trim(), threadId = String(r[COL.thread - 1]).trim();
    if (!threadId || (status !== 'sent' && status !== 'follow1')) continue;
    var thread = GmailApp.getThreadById(threadId);
    if (!thread) continue;
    if (hasReply(thread)) { markReplied(sh, i + 1, thread); continue; }
    var anchor = status === 'sent' ? r[COL.firstSent - 1] : r[COL.follow1 - 1];
    var due = status === 'sent' ? FOLLOW1_DAYS : FOLLOW2_DAYS - FOLLOW1_DAYS;
    if (!(anchor instanceof Date) || businessDaysBetween(anchor, today) < due) continue;
    var key = status === 'sent' ? 'follow1' : 'follow2';
    var t = tpl[key]; if (!t) continue;
    var f = fill(t, r);
    // Reply in the same thread so the prospect sees the first email underneath.
    var last = thread.getMessages()[thread.getMessageCount() - 1];
    last.createDraftReply(f.body);
    setCell(sh, i + 1, COL.status, key + '-drafted');
    log(key + ' drafted', r[COL.email - 1], '');
  }
}

// ---------------------------------------------------------------- 3. what you sent, what came back
function detectSentAndReplies() {
  var sh = contacts(), rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i], status = String(r[COL.status - 1]).trim(), threadId = String(r[COL.thread - 1]).trim();
    if (!threadId) continue;
    var thread = GmailApp.getThreadById(threadId);
    if (!thread) continue;
    var msgs = thread.getMessages(), me = Session.getActiveUser().getEmail().toLowerCase();
    var sentByMe = msgs.filter(function (m) { return !m.isDraft() && m.getFrom().toLowerCase().indexOf(me) >= 0; });
    if (status === 'drafted' && sentByMe.length >= 1) { setCell(sh, i + 1, COL.status, 'sent'); setCell(sh, i + 1, COL.firstSent, sentByMe[0].getDate()); thread.removeLabel(getOrCreateLabel(DRAFT_LABEL)).addLabel(getOrCreateLabel(SENT_LABEL)); log('sent', r[COL.email - 1], ''); }
    if (status === 'follow1-drafted' && sentByMe.length >= 2) { setCell(sh, i + 1, COL.status, 'follow1'); setCell(sh, i + 1, COL.follow1, sentByMe[1].getDate()); log('follow1 sent', r[COL.email - 1], ''); }
    if (status === 'follow2-drafted' && sentByMe.length >= 3) { setCell(sh, i + 1, COL.status, 'closed'); setCell(sh, i + 1, COL.follow2, sentByMe[2].getDate()); log('follow2 sent, sequence closed', r[COL.email - 1], ''); }
    if (hasReply(thread) && status !== 'replied' && status !== 'declined') markReplied(sh, i + 1, thread);
  }
}

function hasReply(thread) {
  var me = Session.getActiveUser().getEmail().toLowerCase();
  return thread.getMessages().some(function (m) { return !m.isDraft() && m.getFrom().toLowerCase().indexOf(me) < 0; });
}

function markReplied(sh, row, thread) {
  var me = Session.getActiveUser().getEmail().toLowerCase();
  var reply = thread.getMessages().filter(function (m) { return !m.isDraft() && m.getFrom().toLowerCase().indexOf(me) < 0; })[0];
  var text = (reply.getPlainBody() || '').trim().slice(0, 200).toLowerCase();
  var declined = /^(no|no thanks|no thank you|hayır|hayir|unsubscribe|remove me|not interested)\b/.test(text);
  setCell(sh, row, COL.status, declined ? 'declined' : 'replied');
  setCell(sh, row, COL.replied, reply.getDate());
  log(declined ? 'declined' : 'replied', reply.getFrom(), text.slice(0, 80));
}

// ---------------------------------------------------------------- helpers
function contacts() { return SpreadsheetApp.openById(SHEET_ID).getSheetByName('Contacts'); }
function templates() {
  var rows = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Templates').getDataRange().getValues(), out = {};
  for (var i = 1; i < rows.length; i++) if (rows[i][0]) out[String(rows[i][0]).trim()] = { subject: String(rows[i][1]), body: String(rows[i][2]) };
  return out;
}
function fill(t, r) {
  var product = r[COL.segment - 1] === 'prop' || r[COL.segment - 1] === 'sales-desk' ? 'desk-signal' : 'analytics';
  var vars = {
    first: r[COL.first - 1], last: r[COL.last - 1], company: r[COL.company - 1], city: r[COL.city - 1], sender: SENDER_NAME,
    demo_link: BASE + '/request-a-demo?product=' + product + '&ref=' + encodeURIComponent(String(r[COL.campaign - 1] || 'mail')),
    sample_link: product === 'desk-signal' ? BASE + '/lab/desk' : BASE + '/lab/blotter?file=samples/fx-blotter-sample.xlsx',
  };
  var sub = function (s) { return s.replace(/\{(\w+)\}/g, function (_, k) { return vars[k] != null ? String(vars[k]) : ''; }); };
  return { subject: sub(t.subject), body: sub(t.body) };
}
function setCell(sh, row, col, v) { sh.getRange(row, col).setValue(v); }
function getOrCreateLabel(name) { return GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name); }
function businessDaysBetween(a, b) {
  var d = new Date(a.getFullYear(), a.getMonth(), a.getDate()), n = 0;
  while (d < b) { d.setDate(d.getDate() + 1); var w = d.getDay(); if (w !== 0 && w !== 6) n++; }
  return n;
}
function log(event, who, detail) {
  var ss = SpreadsheetApp.openById(SHEET_ID), sh = ss.getSheetByName('Log') || ss.insertSheet('Log');
  sh.appendRow([new Date(), event, who, detail]);
}

// Weekly numbers for the founder: sent, replied, declined, by campaign. Run by hand or add a weekly trigger.
function weekly() {
  var rows = contacts().getDataRange().getValues(), by = {};
  for (var i = 1; i < rows.length; i++) {
    var c = String(rows[i][COL.campaign - 1] || 'none'), s = String(rows[i][COL.status - 1]);
    by[c] = by[c] || { sent: 0, replied: 0, declined: 0 };
    if (/^(sent|follow1|follow2|closed|replied|declined|follow1-drafted|follow2-drafted)$/.test(s)) by[c].sent++;
    if (s === 'replied') by[c].replied++;
    if (s === 'declined') by[c].declined++;
  }
  var lines = Object.keys(by).map(function (k) { return k + ': sent ' + by[k].sent + ', replied ' + by[k].replied + ', declined ' + by[k].declined; });
  GmailApp.sendEmail(Session.getActiveUser().getEmail(), 'Kalibre outreach, weekly numbers', lines.join('\n') || 'nothing yet');
}
