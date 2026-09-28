#!/usr/bin/env node
/* ============================================================
   Empaqueta el modelo DENTRO de un .js, para que shelters.html funcione
   abierta con doble clic.
   ------------------------------------------------------------
   El modelo vive en dos .gz que la página descarga con fetch. Eso es lo
   correcto sobre un servidor —se cachean solos y la barra de progreso es real—
   pero con file:// el navegador bloquea fetch y no llega nada. Un <script src>
   no tiene esa restricción, así que el mismo par de archivos va aquí en base64
   y la página lo carga por ese camino cuando el otro falla.

   Se corre después de build-shelter-asset.js, y otra vez si el DWG cambia:
     node scripts/embed-shelter-asset.js
   ============================================================ */
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'assets', 'shelter');
const salida = path.join(dir, 'model-embed.js');

const j = fs.readFileSync(path.join(dir, 'model.json.gz'));
const b = fs.readFileSync(path.join(dir, 'model.bin.gz'));

/* base64 y no un array de bytes: son 4/3 del tamaño en vez de 4 o 5 veces, y
   atob lo deshace de una pasada en C++ en vez de en un bucle de JS. */
const js =
  '/* Generado por scripts/embed-shelter-asset.js — no editar a mano. */\n' +
  'window.SHELTER_MODEL={json:"' + j.toString('base64') + '",bin:"' + b.toString('base64') + '"};\n';

fs.writeFileSync(salida, js);

const mb = n => (n/1048576).toFixed(2) + ' MB';
console.log('model.json.gz  ' + mb(j.length));
console.log('model.bin.gz   ' + mb(b.length));
console.log('→ ' + path.relative(path.join(__dirname,'..'), salida) + '  ' + mb(js.length));
