// Derlenmiş eklentileri (.ex5) depoya yükler; /api/indir abonelere buradan verir.
// Lisans sırrıyla derlenmiş dosyalar repoya ve herkese açık klasöre konmaz.
//
// Kullanım (Upstash bilgileri ortamda, ör. `vercel env pull` ile):
//   node yerel/eklenti-yukle.mjs kopru <KalibreKopru.ex5 yolu> <sürüm>
//   node yerel/eklenti-yukle.mjs motor <KalibreMotor.ex5 yolu> <sürüm>

import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { depoSec } from '../api/_lib/depo.ts';
import { EKLENTILER } from '../api/_lib/lisans.ts';

const [ad, yol, surum] = process.argv.slice(2);
if (!(ad in EKLENTILER) || !yol || !surum) {
  console.error('kullanım: node yerel/eklenti-yukle.mjs <kopru|motor> <.ex5 yolu> <sürüm>');
  process.exit(1);
}
const depo = depoSec();
if (!depo) { console.error('Depo yok: UPSTASH_REDIS_REST_URL ve UPSTASH_REDIS_REST_TOKEN gerekli.'); process.exit(1); }
const b = await readFile(yol);
if (b.length > 700_000) { console.error('Dosya beklenenden büyük; depo sınırını aşabilir.'); process.exit(1); }
const sha256 = createHash('sha256').update(b).digest('hex');
await depo.yaz(`eklenti:${ad}`, JSON.stringify({ dosya: EKLENTILER[ad], surum, sha256, b64: b.toString('base64'), yuklendi: new Date().toISOString() }));
console.log(`${EKLENTILER[ad]} ${surum} yüklendi (${b.length} bayt, sha256 ${sha256.slice(0, 12)}…)`);
