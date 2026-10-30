// Page URL parameters. Public names are English (lang, sample, file, symbol, source); the earlier
// Turkish names (dil, ornek, dosya, sembol, kaynak) are still read so old links keep working.
const LEGACY = { lang: 'dil', sample: 'ornek', file: 'dosya', symbol: 'sembol', source: 'kaynak' };

export function urlParam(name, search = globalThis.location?.search ?? '') {
  const q = new URLSearchParams(search);
  return q.get(name) ?? (LEGACY[name] ? q.get(LEGACY[name]) : null);
}

// ?file= value with the earlier folder names (sablon/, ornek/) mapped to the current ones.
export const sampleFileParam = () => {
  const v = urlParam('file');
  return v ? v.replace(/^sablon\//, 'templates/').replace(/^ornek\//, 'samples/') : v;
};
