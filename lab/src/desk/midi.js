// Desk Signal controller: a MIDI fader box or pad grid drives the desk risk mixer (Web MIDI, Chrome and Edge).
// Plain functions here, no DOM: the page asks for MIDI access and wires the messages to the mixer.
//
// decode(bytes) → { kind: 'cc' | 'on' | 'off', channel, number, value } | null
// controlId(msg) → 'cc:<ch>:<n>' | 'note:<ch>:<n>'     the key a mapping is stored under
// TARGETS: 'trader:1'…'trader:16' (strip order on the console), 'master', 'pad:normal' | 'pad:half' | 'pad:defensive' | 'pad:freeze'
// toPercent(v) → 0-100 in steps of 5 from a 0-127 controller value
// takeover(state, current, incoming) → { apply, state }   soft takeover: a fader whose hardware position differs
//   from the screen does nothing until it passes the screen value, so picking it up never jumps a trader's risk.
// learn(map, id, target) → map                           one control per target, one target per control
// padLights(map, pressedPad) → [[status, note, velocity]] note-on messages that light the pressed pad

export const PADS = ['normal', 'half', 'defensive', 'freeze'];
export const TARGETS = [...Array.from({ length: 16 }, (_, i) => `trader:${i + 1}`), 'master', ...PADS.map(p => `pad:${p}`)];

export function decode(bytes) {
  if (!bytes || bytes.length < 3) return null;
  const type = bytes[0] & 0xf0, channel = bytes[0] & 0x0f, number = bytes[1] & 0x7f, value = bytes[2] & 0x7f;
  if (type === 0xb0) return { kind: 'cc', channel, number, value };
  if (type === 0x90) return { kind: value ? 'on' : 'off', channel, number, value };   // note-on at 0 is a note-off
  if (type === 0x80) return { kind: 'off', channel, number, value };
  return null;
}

export const controlId = m => `${m.kind === 'cc' ? 'cc' : 'note'}:${m.channel}:${m.number}`;

export const toPercent = v => Math.round(((Math.max(0, Math.min(127, v)) / 127) * 100) / 5) * 5;

export function takeover(state, current, incoming) {
  // state: { caught, last } for one control; current: the screen value; incoming: the new hardware value (0-100).
  if (state?.caught) return { apply: true, state: { caught: true, last: incoming } };
  const last = state?.last;
  const crossed = incoming === current || (last != null && (last - current) * (incoming - current) <= 0);
  return { apply: crossed, state: { caught: crossed, last: incoming } };
}

export function learn(map, id, target) {
  if (!TARGETS.includes(target) || !/^(cc|note):\d{1,2}:\d{1,3}$/.test(id)) return map;
  const out = Object.fromEntries(Object.entries(map ?? {}).filter(([k, t]) => k !== id && t !== target));
  out[id] = target;
  return out;
}

export function padLights(map, pressed) {
  return Object.entries(map ?? {}).filter(([k, t]) => k.startsWith('note:') && t.startsWith('pad:')).map(([k, t]) => {
    const [, ch, n] = k.split(':').map(Number);
    return [0x90 | ch, n, t === `pad:${pressed}` ? 127 : 0];
  });
}
