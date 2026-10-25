// Lab ile @kalibre/core arasındaki bağ: çekirdeğin mesajlarını lab'in arayüz diline çevirir.
// lab/src altındaki her çekirdek ara dosyası (motor.js, dogrula.js, ...) bunu içe aktarır.
import { ceviriAyarla } from '../core/src/ceviri.js';
import { t } from './dil.js';

ceviriAyarla(t);
