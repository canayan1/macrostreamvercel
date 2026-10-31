// Desk Signal relay client: posts sealed envelopes and listens for new records. Listening uses a
// server-sent event stream (records arrive within a fraction of a second); when the stream cannot
// run, it falls back to asking every 1.5 seconds. Records only ever leave this file still sealed.

export const API = '/api/desk';

async function retry(fn, tries = 4) {
  for (let k = 0; ; k++) {
    try { return await fn(); } catch (e) { if (k + 1 >= tries || e.permanent) throw e; await new Promise(r => setTimeout(r, 400 * 2 ** k)); }
  }
}

async function call(url, init) {
  const r = await fetch(url, { cache: 'no-store', ...init });
  if (!r.ok) {
    const e = new Error(r.status === 429 ? 'Too many signals in one minute. Wait a moment.' : r.status === 503 ? 'The relay is not set up on this server.' : 'The relay did not answer.');
    e.permanent = r.status === 400 || r.status === 503;
    throw e;
  }
  return r.json();
}

export const post = (channel, envelope) => retry(() => call(`${API}?d=${channel}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(envelope) }));
export const fetchAfter = (channel, after) => retry(() => call(`${API}?d=${channel}&after=${after}`));
export const online = (channel, member) => call(`${API}?d=${channel}&m=${member}&online=1`);

// Calls onRecords(records) with new records in order, and onStatus('live' | 'connecting' | 'polling').
// after() gives the last record already applied. Returns stop().
export function listen(channel, { after, onRecords, onStatus }) {
  let es = null, poll = null, stopped = false, errors = [];
  const startPolling = () => {
    if (poll || stopped) return;
    es?.close(); es = null;
    onStatus('polling');
    const tick = async () => {
      try { const r = await fetchAfter(channel, after()); if (r.records.length) onRecords(r.records); } catch { /* next tick tries again */ }
      if (!stopped) poll = setTimeout(tick, 1500);
    };
    tick();
  };
  const open = () => {
    if (typeof EventSource === 'undefined') return startPolling();
    onStatus('connecting');
    es = new EventSource(`${API}?d=${channel}&stream=1&after=${after()}`);
    es.onopen = () => onStatus('live');
    es.onmessage = m => { try { onRecords([JSON.parse(m.data)]); } catch { /* not a record */ } };
    es.addEventListener('fallback', startPolling);
    es.onerror = () => {
      onStatus('connecting');
      errors = errors.filter(t => Date.now() - t < 20_000).concat(Date.now());
      if (errors.length >= 4) startPolling();
    };
  };
  open();
  return () => { stopped = true; es?.close(); clearTimeout(poll); };
}
