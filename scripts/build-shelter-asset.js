#!/usr/bin/env node
/* ============================================================
   Empaqueta el modelo del shelter para la web
   ------------------------------------------------------------
   El visor original (assets/Datcer-SH-002-2-Tres-Pasillos-3D (1).html) lleva el
   DWG dentro del propio HTML: 4,8 MB de base64 que el navegador tiene que
   descargar y parsear antes de pintar nada. Este script lo saca a dos archivos
   aparte para que se cacheen solos y se carguen cuando hagan falta:

     assets/shelter/model.json.gz   capas, piezas, colores y cotas
     assets/shelter/model.bin.gz    posiciones + indices + matrices

   EL MODELO ESTA INSTANCIADO, y eso es lo que hay que respetar. El DWG no trae
   veinte racks: trae UN rack de 800 x 1310 mm y veinte matrices que lo colocan.
   Lo mismo con los CW40, las condensadoras, las luminarias y los montantes:
   227 piezas de geometria puestas 1394 veces por el array `nodes`. Una version
   anterior de este script tiraba `nodes` y dibujaba cada pieza una sola vez en
   el origen — de ahi que la pasarela mostrara un monton de cosas amontonadas en
   el centro de la sala en vez de la sala.

   Se instancia en vez de hornear las matrices en la geometria porque hornear
   multiplica los vertices por 2,6 (de 388 mil a un millon) y el .gz de 2,3 MB a
   unos 6. Las 1394 matrices ocupan 65 kB.

   Y de paso adelgaza. Las posiciones venian en float32 (4,44 MB) y salen
   cuantizadas a 16 bits sobre la caja de los prototipos (2,22 MB, y comprime
   mejor). Se descartan los buffers de aristas y siluetas: son 1,9 MB y en la
   pasarela no se dibujan.

   Se corre una sola vez:  node scripts/build-shelter-asset.js
   Detras va node scripts/embed-shelter-asset.js, que hace la copia embebida.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SRC = 'assets/Datcer-SH-002-2-Tres-Pasillos-3D (1).html';
const OUT = 'assets/shelter';

function extraer(html, id) {
  const i = html.indexOf('id="' + id + '"');
  if (i < 0) throw new Error('no encuentro el bloque ' + id);
  const a = html.indexOf('>', i) + 1;
  const b = html.indexOf('</script>', a);
  return Buffer.from(html.slice(a, b).trim(), 'base64');
}

const html = fs.readFileSync(SRC, 'utf8');
const meta = JSON.parse(zlib.gunzipSync(extraer(html, 'META')).toString());
const raw = zlib.gunzipSync(extraer(html, 'BLOB'));
const pos = new Float32Array(raw.buffer, raw.byteOffset, meta.off.T / 4);

/* --- quien coloca a quien -------------------------------------------------
   Cada nodo trae su matriz y la lista de piezas que pone con ella. Se da la
   vuelta al indice: cada pieza con todas sus matrices, que es como lo consume
   una InstancedMesh. El unico nodo sin matriz es el Model Space, identidad. */
const IDENT = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
const inst = new Map();                       // indice de pieza -> [matriz, ...]
for (const n of meta.nodes)
  for (const i of n.p) {
    if (!inst.has(i)) inst.set(i, []);
    inst.get(i).push(n.m || IDENT);
  }

/* --- posiciones: float32 -> uint16 sobre la caja de los prototipos --- */
const min = [Infinity, Infinity, Infinity];
const max = [-Infinity, -Infinity, -Infinity];
for (let i = 0; i < pos.length; i += 3)
  for (let k = 0; k < 3; k++) {
    if (pos[i + k] < min[k]) min[k] = pos[i + k];
    if (pos[i + k] > max[k]) max[k] = pos[i + k];
  }
const esc = max.map((v, k) => (v - min[k]) / 65535);
const q = new Uint16Array(pos.length);
for (let i = 0; i < pos.length; i += 3)
  for (let k = 0; k < 3; k++)
    q[i + k] = Math.round((pos[i + k] - min[k]) / esc[k]);

/* --- indices de triangulo tal cual: ya vienen del ancho justo por pieza --- */
const tri = raw.slice(meta.off.T, meta.off.E);

/* --- la caja de cada pieza YA COLOCADA -------------------------------------
   Hace falta para dos cosas: saber cuanto ocupa el conjunto (el encuadre de la
   camara se calcula con eso) y separar el terreno del piso tecnico, que
   comparten la capa A-FLOR. El terreno son 529 m2 de losa contra los 61 del
   piso, asi que se marca por superficie en planta: si no, esa losa blanca se
   come la escena. */
function aplicar(m, x, y, z) {
  return [m[0]*x + m[4]*y + m[8] *z + m[12],
          m[1]*x + m[5]*y + m[9] *z + m[13],
          m[2]*x + m[6]*y + m[10]*z + m[14]];
}
const TODO = {x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity, z0: Infinity, z1: -Infinity};
const CASCO = {x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity, z0: Infinity, z1: -Infinity};
function crecer(c, x, y, z) {
  if (x < c.x0) c.x0 = x; if (x > c.x1) c.x1 = x;
  if (y < c.y0) c.y0 = y; if (y > c.y1) c.y1 = y;
  if (z < c.z0) c.z0 = z; if (z > c.z1) c.z1 = z;
}
/* El casco sale del cerramiento: muros mas montantes de fachada. Da 5960 x
   10200 x 3100 clavado, que son las cotas de catalogo del SH-002-2. */
const PIEL = ['A-WALL', 'A-GLAZ-CWMG'];

/* Anotaciones del plano, no del edificio. A-FLOR-LEVL son doce triangulos de
   marca de nivel plantados a 14 m del modulo: no se ven, pero estiran la caja
   del conjunto dos metros por un lado, y esa caja es la que usa la camara para
   calcular el encuadre de cada paso. */
const DESCARTE = ['A-FLOR-LEVL'];

const mats = [];                   // 12 float por instancia, en el orden de parts
const parts = [];
meta.parts.forEach((p, i) => {
  if (!p.tn) return;               // piezas que solo traian aristas
  const ms = inst.get(i) || [];
  if (!ms.length) return;
  const capa = meta.layers[p.l];
  if (DESCARTE.indexOf(capa) >= 0) return;

  let sx0 = Infinity, sx1 = -Infinity, sy0 = Infinity, sy1 = -Infinity;
  const io = mats.length / 12;
  for (const m of ms) {
    /* la ultima fila de la matriz es 0,0,0,1 en todo el DWG: no se guarda */
    mats.push(m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10], m[12], m[13], m[14]);
    for (let v = p.vo; v < p.vo + p.vn; v++) {
      const [X, Y, Z] = aplicar(m, pos[v*3], pos[v*3+1], pos[v*3+2]);
      crecer(TODO, X, Y, Z);
      if (PIEL.indexOf(capa) >= 0) crecer(CASCO, X, Y, Z);
      if (X < sx0) sx0 = X; if (X > sx1) sx1 = X;
      if (Y < sy0) sy0 = Y; if (Y > sy1) sy1 = Y;
    }
  }
  const o = {vo: p.vo, vn: p.vn, to: p.to, tn: p.tn, w: p.w, c: p.c, a: p.a, l: p.l,
             io, in: ms.length};
  if ((sx1 - sx0) * (sy1 - sy0) / 1e6 > 200) o.g = 1;   // g de "ground"
  parts.push(o);
});

/* matrices al final del bin, alineadas a 4 para poder leerlas como Float32Array */
const relleno = (4 - ((q.byteLength + tri.length) % 4)) % 4;
const mbuf = Buffer.from(new Float32Array(mats).buffer);
const bin = Buffer.concat([Buffer.from(q.buffer), tri, Buffer.alloc(relleno), mbuf]);

const nuevo = {
  layers: meta.layers,
  quant: {min, esc},
  off: {V: 0, T: q.byteLength, M: q.byteLength + tri.length + relleno},
  unit: {
    x0: CASCO.x0, x1: CASCO.x1, y0: CASCO.y0, y1: CASCO.y1, z0: CASCO.z0, z1: CASCO.z1,
    w: CASCO.x1 - CASCO.x0, l: CASCO.y1 - CASCO.y0, h: CASCO.z1 - CASCO.z0
  },
  /* La huella a encuadrar no es la del shelter sino la de todo lo que trae el
     DWG: los dos patios de condensadoras y sus losas. Se mide aqui, con las
     matrices puestas, en vez de deducirla del rango de cuantizacion — que
     ahora es el de los prototipos y no tiene nada que ver con el mundo. */
  ext: {w: TODO.x1 - TODO.x0, d: TODO.y1 - TODO.y0, h: TODO.z1 - TODO.z0},
  parts
};

fs.mkdirSync(OUT, {recursive: true});
const j = zlib.gzipSync(Buffer.from(JSON.stringify(nuevo)), {level: 9});
const b = zlib.gzipSync(bin, {level: 9});
fs.writeFileSync(path.join(OUT, 'model.json.gz'), j);
fs.writeFileSync(path.join(OUT, 'model.bin.gz'), b);

const mb = n => (n / 1048576).toFixed(2) + ' MB';
console.log('piezas     ', parts.length, 'de', meta.parts.length);
console.log('instancias ', mats.length / 12);
console.log('vertices   ', (pos.length / 3).toLocaleString(), '(prototipo)');
console.log('triangulos ', (parts.reduce((a, p) => a + p.tn, 0) / 3).toLocaleString(), '(prototipo)');
console.log('resolucion ', esc.map(v => v.toFixed(3)).join(' / '), 'mm');
console.log('casco      ', [nuevo.unit.w, nuevo.unit.l, nuevo.unit.h].map(v => v.toFixed(0)).join(' x '), 'mm');
console.log('conjunto   ', [nuevo.ext.w, nuevo.ext.d, nuevo.ext.h].map(v => v.toFixed(0)).join(' x '), 'mm');
console.log('model.json.gz', mb(j.length));
console.log('model.bin.gz ', mb(b.length));
