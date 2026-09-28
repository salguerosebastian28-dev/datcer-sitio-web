#!/usr/bin/env node
/* ============================================================
   Exporta el portafolio a PDF y a PowerPoint
   ------------------------------------------------------------
   Los dos archivos se generan UNA VEZ, aqui, y la pagina solo los enlaza. La
   alternativa —generarlos en el navegador con html2pdf o similar— obliga a
   cargar medio mega de libreria en cada visita para producir algo peor: una
   foto de la pantalla en vez de un documento.

   El PDF sale del propio motor de impresion de Chrome sobre la hoja `@media
   print` de `css/brochure.css`. Eso significa TEXTO VECTORIAL: se puede
   seleccionar, buscar y ampliar sin que se pixele. Una lamina por pagina, en
   apaisado 16:9.

   El PPTX lleva una diapositiva por lamina, cada una con la captura de la
   lamina a pantalla completa. Es una presentacion no editable, que es lo que se
   entrega a un cliente: si fuera editable, cualquiera podria descuadrar la
   maqueta al abrirla.

   COMO SE CORRE
     1. Sirve el sitio en local:            npx serve . -l 8731
     2. Arranca Chrome con depuracion:      chrome --headless=new
                                              --remote-debugging-port=9333
     3. node scripts/export-brochure.js [url] [puerto-cdp]

   pptxgenjs no vive en el proyecto: se instala aparte (`npm i pptxgenjs` en
   cualquier carpeta) y se le pasa la ruta en PPTX_LIB. El sitio sigue sin
   dependencias.
   ============================================================ */
const fs   = require('fs');
const path = require('path');

const URL    = process.argv[2] || 'http://localhost:8731/brochure.html';
const CDP    = process.argv[3] || '9333';
const SALIDA = path.join(__dirname, '..', 'assets');
const PPTX_LIB = process.env.PPTX_LIB || 'pptxgenjs';

/* 16:9 sobre el ancho util de un A4 apaisado, en pulgadas para el PDF */
const PAG = {w: 297 / 25.4, h: 167 / 25.4};

const esperar = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  /* El WebSocket de Node no mantiene vivo el bucle de eventos. Mientras Chrome
     imprime el PDF no queda ningun temporizador pendiente y el proceso se cierra
     solo, con codigo 0 y sin escribir nada. Este latido lo sostiene. */
  const latido = setInterval(() => {}, 1000);
  process.on('unhandledRejection', e => { console.error('fallo:', e && e.message || e); process.exit(1); });

  const tabs = await (await fetch(`http://127.0.0.1:${CDP}/json/list`)).json();
  const page = tabs.find(t => t.type === 'page');
  if (!page) throw new Error('no hay pestana en el puerto ' + CDP);

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pend = new Map();
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) {
      /* Sin esto un fallo del protocolo se traga: `result` llega vacio y el
         error aparece mucho despues, como si faltara un campo. */
      if (m.error) { pend.get(m.id)(Promise.reject(new Error(m.error.message))); }
      else pend.get(m.id)(m.result);
      pend.delete(m.id);
    }
  };
  await new Promise(r => ws.onopen = r);
  const cdp = (metodo, params = {}) => new Promise(r => {
    const i = ++id; pend.set(i, r);
    ws.send(JSON.stringify({id: i, method: metodo, params}));
  });
  const ev = async expr => {
    const r = await cdp('Runtime.evaluate', {expression: expr, returnByValue: true, awaitPromise: true});
    return r && r.result ? r.result.value : null;
  };

  await cdp('Runtime.enable'); await cdp('Page.enable');
  await cdp('Emulation.setDeviceMetricsOverride', {width: 1600, height: 900, deviceScaleFactor: 2, mobile: false});
  await cdp('Page.navigate', {url: URL});
  await esperar(6000);

  /* El preloader anima un contador con GSAP y en un Chrome sin GPU tarda casi un
     minuto en llegar a 100. Aqui estorba: se salta y se fuerza el recalculo. */
  await ev(`
    if (window.gsap) gsap.ticker.lagSmoothing(0);
    var p = document.getElementById('pre'); if (p) p.style.display = 'none';
    document.body.classList.remove('lock');
    if (window.ScrollTrigger) ScrollTrigger.refresh();
    1`);
  /* Las laminas cargan con `loading="lazy"`, asi que las que estan fuera de
     pantalla NUNCA empiezan a descargar y su `decode()` no resuelve jamas: la
     espera se colgaria para siempre. Se les quita el lazy, se fuerza la carga y
     se pone un tope de tiempo por si alguna imagen falta. */
  await ev(`
    [].forEach.call(document.images, function(i){ i.loading = 'eager'; });
    1`);
  await ev(`Promise.race([
    Promise.all([].map.call(document.images, function(i){
      return i.complete ? 0 : new Promise(function(r){ i.onload = i.onerror = r; });
    })),
    new Promise(function(r){ setTimeout(r, 30000); })
  ]).then(function(){ return 1; })`);
  await esperar(4000);

  /* El pin de ScrollTrigger envuelve el deck en un `.pin-spacer` con veinte mil
     pixeles de relleno —el recorrido del scroll— y deja la pista desplazada y
     fija. Al imprimir, ese relleno son doce hojas en blanco y la pista se sale
     de su caja. Matar los disparadores revirtiendo devuelve el DOM a como
     estaba antes de que GSAP lo tocara. */
  await ev(`if (window.ScrollTrigger) ScrollTrigger.getAll().forEach(function(t){ t.kill(true); });
    if (window.gsap) gsap.set('#dktr', {clearProps:'all'});
    1`);
  await esperar(1200);

  const n = await ev("document.querySelectorAll('#dktr > .sl').length");
  console.log('pagina lista');
  console.log(`laminas: ${n}`);
  fs.mkdirSync(SALIDA, {recursive: true});

  /* ---------- PDF ----------
     `transferMode: 'ReturnAsStream'` es obligatorio aqui. Devuelto en un solo
     mensaje, el PDF viaja como un base64 de varios megas por el WebSocket y la
     llamada no vuelve nunca: el proceso se queda colgado sin error. Por stream
     llega a trozos y ademas no hay que tener el documento entero en memoria. */
  console.log('imprimiendo...');
  const pdf = await cdp('Page.printToPDF', {
    landscape: false,               // el tamano ya es apaisado por `@page`
    printBackground: true,          // sin esto las laminas oscuras salen en blanco
    preferCSSPageSize: true,
    paperWidth: PAG.w, paperHeight: PAG.h,
    marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
    scale: 1,
    transferMode: 'ReturnAsStream'
  });
  const rutaPdf = path.join(SALIDA, 'DATCER-Portafolio-2026.pdf');
  const sal = fs.createWriteStream(rutaPdf);
  for (let fin = false; !fin; ) {
    const t = await cdp('IO.read', {handle: pdf.stream, size: 1 << 20});
    if (t.data) sal.write(Buffer.from(t.data, t.base64Encoded ? 'base64' : 'utf8'));
    fin = t.eof;
  }
  await new Promise(r => sal.end(r));
  await cdp('IO.close', {handle: pdf.stream});
  console.log(`PDF  -> ${(fs.statSync(rutaPdf).size / 1048576).toFixed(2)} MB`);

  /* ---------- PPTX ----------
     Una captura por lamina, a doble densidad. Se desplaza cada lamina al centro
     con `scrollIntoView` y se recorta su rectangulo: capturar por coordenadas
     calculadas a mano fallaria en cuanto cambie una medida del CSS. */
  let PptxGenJS;
  try { PptxGenJS = require(PPTX_LIB); }
  catch (e) {
    console.log('PPTX -> omitido: no encuentro pptxgenjs. Instalalo y pasa PPTX_LIB=<ruta>');
    process.exit(0);
  }

  const pptx = new PptxGenJS();
  pptx.defineLayout({name: 'DATCER', width: PAG.w, height: PAG.h});
  pptx.layout = 'DATCER';
  pptx.author = 'DATCER';
  pptx.company = 'DATCER S.A.S.';
  pptx.title = 'Portafolio de servicios 2026';

  /* La pista esta desplazada por el scroll horizontal; para capturar hay que
     deshacer ese desplazamiento y apilar las laminas, que es justo lo que hace
     la hoja de impresion. Se le pide al navegador que renderice como si
     imprimiera y asi cada lamina queda quieta y completa. */
  await cdp('Emulation.setEmulatedMedia', {media: 'print'});
  /* La ventana pasa a medir una lamina justa (297x167mm a 96ppp) para que el
     recorte de cada captura entre entera sin salirse. */
  await cdp('Emulation.setDeviceMetricsOverride',
    {width: 1123, height: 631, deviceScaleFactor: 2, mobile: false});
  await esperar(2500);

  for (let i = 0; i < n; i++) {
    const caja = await ev(`(function(){
      var s = document.querySelectorAll('#dktr > .sl')[${i}];
      s.scrollIntoView({block:'start'});
      var r = s.getBoundingClientRect();
      return JSON.stringify({x:r.left+scrollX, y:r.top+scrollY, w:r.width, h:r.height, sy:scrollY});
    })()`);
    await esperar(450);
    const c = JSON.parse(caja);
    if (Math.abs(c.y - c.sy) > 2) console.log(`
  aviso: lamina ${i + 1} desalineada`);
    /* Sin `clip`. Con `captureBeyondViewport` en falso el recorte se sigue
       midiendo en coordenadas de PAGINA, asi que a partir de la lamina diez cae
       fuera de lo que Chrome ha pintado y salen doce capturas identicas en
       blanco. Como la ventana mide exactamente una lamina y la lamina esta
       pegada arriba, la ventana entera YA es la diapositiva. */
    const shot = await cdp('Page.captureScreenshot', {format: 'png'});
    const sl = pptx.addSlide();
    sl.addImage({data: 'image/png;base64,' + shot.data, x: 0, y: 0, w: PAG.w, h: PAG.h});
    process.stdout.write(`\r  diapositiva ${i + 1}/${n}`);
  }
  process.stdout.write('\n');
  await cdp('Emulation.setEmulatedMedia', {media: ''});

  const rutaPptx = path.join(SALIDA, 'DATCER-Portafolio-2026.pptx');
  await pptx.writeFile({fileName: rutaPptx});
  console.log(`PPTX -> ${(fs.statSync(rutaPptx).size / 1048576).toFixed(2)} MB`);
  clearInterval(latido);
  process.exit(0);
})();
