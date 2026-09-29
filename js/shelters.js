/* ============================================================
   DATCER · shelters — pasarela del módulo SH-002-2
   ------------------------------------------------------------
   La página comparte el sistema visual de index.html pero no su main.js: aquel
   engancha secciones que aquí no existen y reventaría a la primera. Lo que se
   repite abajo es el núcleo común —preloader, cabecera, menú, split, reveals—
   y de ahí en adelante todo es propio de esta página.
   ============================================================ */
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TOUCH = matchMedia('(hover:none),(pointer:coarse)').matches;
gsap.registerPlugin(ScrollTrigger);
/* En un telefono la barra del navegador aparece y se esconde cada vez que se
   cambia de sentido, y eso cambia el alto de la ventana. Si ese cambio dispara
   un recalculo, las secciones fijadas se deshacen y se rehacen en pleno gesto
   y el scroll vuelve atras: la pagina parecia recargarse y no dejaba avanzar.
   Solo el alto no recalcula; girar el telefono (cambia el ancho) si. */
ScrollTrigger.config({ignoreMobileResize:true});
gsap.defaults({ease:'power3.out'});

/* El marco del hero se abre al bajar (--hx de 1 a 0) y, mientras el perla
   asoma por los bordes, la cabecera va en oscuro con el logo original. Mismo
   gesto que en el inicio. En móvil el hero va a sangre y no hay marco. */
(function(){
  var hero = document.getElementById('sh-hero'), hd = document.getElementById('hd');
  if (!hero || !hd) return;
  var conMarco = getComputedStyle(hero).getPropertyValue('--hx').trim() !== '0';
  if (conMarco && !RM) gsap.fromTo(hero, {'--hx':1}, {'--hx':0, ease:'none',
    scrollTrigger:{trigger:hero, start:'top top', end:'58% top', scrub:.6}});
  /* La posición la da el propio ScrollTrigger: `ln` (Lenis) se declara más
     abajo con `let` y leerlo aquí caía en su zona muerta temporal. */
  var pinta = function(y){
    if (conMarco) hd.classList.toggle('perla', y < innerHeight * .3);
    document.documentElement.style.setProperty('--hs', (120 - (y * .12) % 240) + '%');
  };
  ScrollTrigger.create({start:0, end:'max',
    onUpdate:function(st){ pinta(st.scroll()); },
    onRefresh:function(st){ pinta(st.scroll()); }});
  pinta(window.scrollY || 0);
})();

/* La foto del hero: entra ampliada y se asienta, y después viaja con el scroll.
   Mide 114 % de alto y arranca en -7 %: ese sobrante es el recorrido (±6 %), así
   que el borde nunca asoma. */
(function(){
  var im = document.querySelector('#sh-hero .sh-bg img'); if (!im) return;
  if (!RM) {
    gsap.fromTo(im, {scale:1.12}, {scale:1, duration:2.2, ease:'expo.out'});
    gsap.fromTo(im, {yPercent:-6}, {yPercent:6, ease:'none',
      scrollTrigger:{trigger:'#sh-hero', start:'top top', end:'bottom top', scrub:true}});
  }
})();

/* ---------- scroll suave ---------- */
let ln = null;
if (!RM && typeof Lenis !== 'undefined'){
  ln = new Lenis({duration:1.25, smoothWheel:true, touchMultiplier:1.7});
  ln.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => ln.raf(t*1000));
  gsap.ticker.lagSmoothing(0);
}
const to = s => ln ? ln.scrollTo(s,{duration:1.5}) : document.querySelector(s)?.scrollIntoView({behavior:'smooth'});

/* Llegar con un ancla —index.html#cfg desde el menu de otra pagina—. El
   navegador intenta saltar al cargar, pero en ese momento el precargador
   bloquea el scroll y las secciones fijadas aun no han metido su alto: se
   quedaba arriba. Se salta aqui, cuando ya esta todo medido. */
function irAlAncla(){
  var h = location.hash; if (!h || h.length < 2) return;
  var el = null; try { el = document.querySelector(h); } catch (e) { return; }
  if (!el) return;
  requestAnimationFrame(function(){
    if (ln) ln.scrollTo(el, {immediate:true, force:true}); else el.scrollIntoView();
  });
}

/* ---------- split en líneas reales ---------- */
function splitLines(el){
  /* Las palabras marcadas con <em> llevan el acento. El splitter antiguo hacia
     `el.textContent` y las perdia por el camino: ahora se recorren los nodos y
     cada palabra se guarda con su marca, para devolverla al reconstruir. */
  const esc = t => t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const piezas = [];
  (function leer(nodo, acc){
    nodo.childNodes.forEach(n=>{
      if (n.nodeType === 3) n.textContent.split(/\s+/).filter(Boolean).forEach(w=>piezas.push({w, acc}));
      else if (n.nodeType === 1) leer(n, acc || n.tagName === 'EM');
    });
  })(el, false);
  el.innerHTML = piezas.map(p=>`<span class="wd"><i>${esc(p.w)}</i></span>`).join(' ');
  const words = [...el.querySelectorAll('.wd')];
  const groups = []; let top = null, cur = null;
  words.forEach((w,i)=>{
    const t = Math.round(w.offsetTop);
    if (t !== top){ top = t; cur = []; groups.push(cur); }
    cur.push(piezas[i]);
  });
  el.innerHTML = '';
  groups.forEach(g=>{
    const line = document.createElement('span'); line.className='ln';
    const inner = document.createElement('i');
    g.forEach((p,i)=>{
      if (i) inner.appendChild(document.createTextNode(' '));
      if (p.acc){ const em = document.createElement('em'); em.textContent = p.w; inner.appendChild(em); }
      else inner.appendChild(document.createTextNode(p.w));
    });
    line.appendChild(inner); el.appendChild(line);
  });
  /* en columna flex los márgenes negativos de las líneas no se colapsan entre
     sí, que es lo que hace que el aire de la máscara salga a cero por fuera */
  el.classList.add('sp');
  return [...el.querySelectorAll('.ln > i')];
}
const splitMap = new Map();
/* Onest llega por CDN. Si se parte antes de que cargue, las líneas se miden con
   la tipografía de reserva y al sustituirse el texto reflota dentro de una
   máscara ya dimensionada: el titular sale cortado por abajo. */
function doSplits(){
  document.querySelectorAll('[data-split="line"]').forEach(el=>{
    if (splitMap.has(el)) return;
    splitMap.set(el, splitLines(el));
  });
}
const listo = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();

/* ---------- preloader ---------- */
document.body.classList.add('lock');
const pre = document.getElementById('pre'), pc = pre.querySelector('.pc'), pb = pre.querySelector('.bar > i');
const cnt = {v:0};
function heroIn(){
  gsap.timeline()
    .from('#sh-hero .tag', {yPercent:120, opacity:0, duration:1}, .1)
    .from(splitMap.get(document.querySelector('#sh-hero h1')) || [],
          {yPercent:112, duration:1.35, stagger:.09, ease:'expo.out'}, .2)
    .from('#sh-hero .ft', {y:40, opacity:0, duration:1.1}, .7)
    .from('#hd, #sc', {opacity:0, duration:.9}, .6)
    .to('#ch', {opacity:1, duration:.8}, .9);
}
listo.then(()=>{ doSplits(); arranque(); });
function arranque(){
gsap.timeline({onComplete:()=>{document.body.classList.remove('lock'); heroIn(); ScrollTrigger.refresh(); irAlAncla();}})
  .to(cnt, {v:100, duration:1.6, ease:'power2.inOut', onUpdate:()=>pc.textContent=Math.round(cnt.v)}, 0)
  .to(pb, {scaleX:1, duration:1.6, ease:'power2.inOut'}, 0)
  .to('#pre .word, #pre .pc, #pre .top', {opacity:0, y:-18, duration:.55, stagger:.04}, '>-.05')
  .to(pre, {yPercent:-101, duration:1.1, ease:'expo.inOut'}, '>-.15')
  .set(pre, {display:'none'});
}

/* ---------- cabecera, menú y capítulo ---------- */
/* ============================================================
   LA BARRA DE LA CABECERA · se recompone al subir
   ------------------------------------------------------------
   Al bajar, la cabecera se esconde. Al subir vuelve, y la barra blanca no
   aparece de golpe: se monta con tiras que suben desde su base, en orden
   aleatorio, y un destello la cruza cuando ya están todas. Arriba del todo no
   sale — ahí ya está el marco perla del hero.
   ============================================================ */
function barraCabecera(hd){
  var bg = hd.querySelector('.hd-bg'); if (!bg || typeof gsap === 'undefined') return function(){};

  /* En telefonos y tabletas, sin montaje: la barra entra con un fundido y ya.
     Las ~180 celdas animandose a la vez cada vez que se sube un poco se
     trababan en un telefono, y como el gesto se repite en cada scroll hacia
     arriba, cansaba. El montaje queda solo para computador. */
  if (TOUCH || innerWidth <= 860){
    var ya = null;
    return function(si){
      if (si === ya) return;
      ya = si;
      hd.classList.toggle('barra', si);
      bg.classList.toggle('lleno', si);
      gsap.to(bg, {opacity: si ? 1 : 0, duration: si ? .3 : .2, ease: 'power2.out', overwrite: true});
    };
  }

  /* Una MALLA, no tiras. Con tiras verticales el montaje se leía como una
     persiana; en celdas pequeñas se lee como material que se deposita. Cada
     celda muestra su trozo del degradado (tamaño N columnas x M filas), así que
     al terminar no hay mosaico: es una superficie. */
  var COL = 46, FIL = 4, celdas = [];
  bg.innerHTML = '';
  for (var f = 0; f < FIL; f++){
    for (var k = 0; k < COL; k++){
      var t = document.createElement('i');
      t.style.left   = (k / COL * 100) + '%';
      t.style.top    = (f / FIL * 100) + '%';
      t.style.width  = (100 / COL) + '%';
      t.style.height = (100 / FIL) + '%';
      t.style.backgroundSize = (COL * 100) + '% ' + (FIL * 100) + '%';
      t.style.backgroundPosition = (k / (COL - 1) * 100) + '% ' + (f / (FIL - 1) * 100) + '%';
      bg.appendChild(t); celdas.push(t);
    }
  }
  var cabezal = document.createElement('span'); cabezal.className = 'cab'; bg.appendChild(cabezal);
  var destello = document.createElement('span'); destello.className = 'br'; bg.appendChild(destello);
  gsap.set([cabezal, destello], {opacity:0});

  var puesta = null;
  return function(si){
    if (si === puesta) return;
    puesta = si;
    hd.classList.toggle('barra', si);
    if (!si){
      gsap.to(bg, {opacity:0, duration:.25, ease:'power2.out'});
      bg.classList.remove('lleno');
      return;
    }
    gsap.set(bg, {opacity:1});
    bg.classList.remove('lleno');

    /* El cabezal barre y detrás de él las celdas se posan en ola: llegan
       giradas y encogidas, y entran con un `back` corto — ese rebote mínimo al
       encajar es lo que lo hace ver ensamblado y no fundido. El escalonado va
       por rejilla y en el eje X, así que la ola sigue al cabezal. */
    var tl = gsap.timeline({overwrite:true});
    tl.fromTo(cabezal, {left:'-2%', opacity:0}, {left:'102%', opacity:1, duration:.66, ease:'power2.inOut'}, 0)
      .to(cabezal, {opacity:0, duration:.2}, .58)
      .fromTo(celdas,
        {opacity:0, scale:.42, rotate:function(i){ return i % 3 ? 7 : -7; },
         x:function(i){ return i % 2 ? 10 : -10; }, y:function(i){ return i % 4 < 2 ? -12 : 12; }},
        {opacity:1, scale:1, rotate:0, x:0, y:0, duration:.5, ease:'back.out(2)',
         stagger:{grid:[4, 46], axis:'x', from:'start', amount:.5}}, .04)
      /* cada celda enciende su filo al posarse y se apaga enseguida */
      .fromTo(celdas.map(function(c){ return c; }), {}, {duration:.001}, 0)
      .add(function(){ if (puesta) bg.classList.add('lleno'); }, .62)
      .fromTo(destello, {xPercent:-120, opacity:0},
        {xPercent:120, opacity:1, duration:.8, ease:'power2.inOut',
         onComplete:function(){ gsap.set(destello, {opacity:0}); }}, .58);
  };
}

const hd = document.getElementById('hd');
const ponerBarra = barraCabecera(hd);
let last = 0;
ScrollTrigger.create({start:0, end:'max', onUpdate:s=>{
  const y = s.scroll();
  if (!document.body.classList.contains('mo')) hd.classList.toggle('up', y > last && y > 460);
  ponerBarra(y > 470 && !hd.classList.contains('up'));
  last = y;
}});

const mn = document.getElementById('mn'), bgB = document.getElementById('bg');
const mLinks = mn.querySelectorAll('ol a');
let open = false;
const mtl = gsap.timeline({paused:true})
  .set(mn,{visibility:'visible'})
  .to(mn,{clipPath:'inset(0 0 0% 0)', duration:.9, ease:'expo.inOut'})
  .to(mLinks,{y:'0%', duration:.9, stagger:.05, ease:'expo.out'},'-=.5')
  .to('#mn .side',{opacity:1,duration:.6},'-=.5');
function tog(f){
  open = typeof f==='boolean' ? f : !open;
  document.body.classList.toggle('mo', open);
  bgB.setAttribute('aria-expanded', open);
  mn.setAttribute('aria-hidden', !open);
  if (open){ mtl.play(); ln&&ln.stop(); }
  else { mtl.reverse(); ln&&ln.start(); gsap.delayedCall(.95,()=>{ if(!open) gsap.set(mn,{visibility:'hidden'}); }); }
}
bgB.addEventListener('click',()=>tog());
addEventListener('keydown',e=>{ if(e.key==='Escape'&&open) tog(false); });
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
  const t=a.getAttribute('href'); if(t.length>1&&document.querySelector(t)){e.preventDefault(); tog(false); to(t);}
}));

const chI = document.querySelector('#ch .c i'), chN = document.getElementById('chn');
document.querySelectorAll('[data-ch]').forEach(s=>{
  ScrollTrigger.create({trigger:s, start:'top 55%', end:'bottom 55%',
    onToggle:st=>{ if(st.isActive){
      if (chI.textContent !== s.dataset.ch){
        gsap.to(chI,{yPercent:-100,duration:.3,ease:'power2.in',onComplete:()=>{
          chI.textContent = s.dataset.ch; gsap.fromTo(chI,{yPercent:100},{yPercent:0,duration:.4,ease:'power2.out'});
        }});
      }
      chN.innerHTML = s.dataset.nm;
    }}});
});

/* ---------- reveals ---------- */
/* Igual que en main.js: el destello se ata al scroll, no a un reloj. */
function brillo(sel){
  document.querySelectorAll(sel).forEach(el=>{
    if (el.dataset.gl) return; el.dataset.gl='1';
    if (RM){ el.style.setProperty('--sheen','50%'); return; }
    gsap.fromTo(el, {'--sheen':'150%'}, {'--sheen':'-50%', ease:'none',
      scrollTrigger:{trigger:el, start:'top 96%', end:'bottom 24%', scrub:.7}});
  });
}
listo.then(()=>{
  doSplits();
  brillo('.ln > i em');
  brillo('.sh-tbl li b');
  document.querySelectorAll('[data-split="line"]').forEach(el=>{
    if (el.closest('#sh-hero')) return;
    gsap.from(splitMap.get(el)||[], {yPercent:112, duration:1.15, stagger:.075, ease:'expo.out',
      scrollTrigger:{trigger:el, start:'top 87%'}});
  });
  ScrollTrigger.refresh();
});
document.querySelectorAll('[data-anim="up"]').forEach(el=>{
  if (el.closest('#sh-hero')) return;
  gsap.from(el,{y:38, opacity:0, duration:1.1, scrollTrigger:{trigger:el, start:'top 92%'}});
});
document.querySelectorAll('.step .bd, .step .bd-s, .step .idx, .sh-tbl li').forEach(el=>{
  gsap.from(el,{y:26, opacity:0, duration:.9, scrollTrigger:{trigger:el, start:'top 90%'}});
});

/* ---------- cursor ---------- */
if (!TOUCH){
  const cr=document.getElementById('cr'), cx=document.getElementById('cx');
  const p={x:innerWidth/2,y:innerHeight/2}, q={...p};
  addEventListener('mousemove',e=>{p.x=e.clientX;p.y=e.clientY;
    gsap.set(cr,{x:p.x,y:p.y});});
  gsap.ticker.add(()=>{q.x+=(p.x-q.x)*.14; q.y+=(p.y-q.y)*.14; gsap.set(cx,{x:q.x,y:q.y});});
  document.querySelectorAll('a,button').forEach(el=>{
    el.addEventListener('mouseenter',()=>gsap.to(cx,{width:56,height:56,duration:.4}));
    el.addEventListener('mouseleave',()=>gsap.to(cx,{width:34,height:34,duration:.4}));
  });
}

/* ============================================================
   EL MÓDULO EN 3D
   ------------------------------------------------------------
   La geometría es el DWG de ingeniería, empaquetado aparte por
   scripts/build-shelter-asset.js. Llega en dos archivos gzip que se
   descomprimen en el navegador; el HTML no lleva ni un byte del modelo.
   ============================================================ */
(function(){
  const cv = document.getElementById('shv');
  if (!cv || typeof THREE === 'undefined') return;

  const box  = document.getElementById('shload');
  const bar  = document.getElementById('shbar');
  const bpc  = document.getElementById('shpc');
  const hudK = document.getElementById('hudK');
  const hudV = document.getElementById('hudV');
  const hudF = document.getElementById('hudFig');
  const pasos = [...document.querySelectorAll('.step')];

  /* --- reparto de capas por papel en el relato ---------------------------
     Los nombres son los del DWG. El mapa completo, con su traducción, está en
     el visor original: A-* arquitectura, E-* eléctrico y datos, M-* clima,
     P-* tubería, F-/Q-* protección contra incendio. */
  const ROL = {
    piel : ['A-WALL','A-GLAZ-CWMG','A-GLAZ-CURT','A-DOOR','A-DOOR-FRAM','A-DOOR-GLAZ'],
    racks: ['E-DATA'],
    clima: ['M-EQPM','P-PIPE','P-PIPE-CNTR'],
    elec : ['E-ELEC-EQPM','E-POWR-CNDT','E-POWR-CNTR','E-ELEC-FIXT'],
    datos: ['E-CABL-TRAY','E-CABL-TRAY-CNTR','E-DATA','E-LITE-EQPM'],
    /* G-IMPT va con la detección: las sirenas Edwards reparten su geometría
       entre esa capa y E-FIRE, y realzar solo una las parte por la mitad. */
    detec: ['E-FIRE','G-IMPT'],
    supre: ['Q-SPCQ','F-SPRN']
  };
  /* Estas dos no se ven nunca, en ningún paso: el cerramiento opaco deja el
     recorrido mirando una caja cerrada. Es lo mismo que hace a mano el panel de
     capas del visor original. Es una convención de dibujo y no se explica en la
     página: al cliente se le enseña la sala, no cómo se abrió el modelo. */
  const APAGADAS = ['A-WALL','A-GLAZ-CWMG'];

  /* Realzar sin quitar la piel deja el interior detrás de un muro fantasma. En
     los pasos que miran adentro se hacen las dos cosas: fuera el cerramiento y
     el resto de capas al 10 %, que siguen dando el contexto de la sala. */
  const SETS = {
    all       : null,
    'skin-off': {ocultar:ROL.piel},
    racks     : {ocultar:ROL.piel, realzar:ROL.racks},
    clima     : {ocultar:ROL.piel, realzar:ROL.clima},
    elec      : {ocultar:ROL.piel, realzar:ROL.elec},
    datos     : {ocultar:ROL.piel, realzar:ROL.datos},
    deteccion : {ocultar:ROL.piel, realzar:ROL.detec},
    supresion : {ocultar:ROL.piel, realzar:ROL.supre}
  };

  /* --- paleta -------------------------------------------------------------
     El DWG viene con los colores del plano: blancos, amarillos de bandeja,
     rojo y verde de tubería. Sobre el navy del sitio eso es otro registro.
     Se conserva la LUMINANCIA de cada color —que es la que separa unas piezas
     de otras y da a leer el volumen— y se reasigna el tono: la sala entera en
     el azul de la casa y solo las capas que el relato señala en el naranja del
     logo. Así el modelo sigue siendo legible y deja de parecer importado. */
  const FRIO = new THREE.Color(0x223652), CLARO = new THREE.Color(0x8FA2BE);
  const CAL  = new THREE.Color(0x6B3520), CALC  = new THREE.Color(0xD4611F);
  const SUELO = new THREE.Color(0x0A1730);
  /* El acento se gana, no se reparte. Cuando el modelo se dibujaba sin sus
     matrices —un rack y una unidad de clima en el origen— pintar de naranja los
     racks y el clima marcaba dos objetos. Con las 1394 instancias reales son
     32 gabinetes y 88 equipos, y la sala entera sale naranja: el acento deja de
     señalar nada. La masa de la sala va en el azul de la casa, que es lo que la
     hace legible, y el naranja queda para lo que el relato apunta y además es
     escaso — supresión, detección y rociadores. */
  const ACENTO = ['Q-SPCQ','F-SPRN','E-FIRE'];
  function tinte(hex, capa, terreno){
    if (terreno) return SUELO.clone();
    const c = new THREE.Color(hex);
    const l = Math.min(1, Math.max(0, .21*c.r + .72*c.g + .07*c.b));
    const k = Math.pow(l, 1.15);   // curva por debajo de la lineal: el DWG es casi todo claro
    const a = ACENTO.indexOf(capa) >= 0;
    return (a ? CAL : FRIO).clone().lerp(a ? CALC : CLARO, k);
  }

  /* --- WebGL --- */
  const rnd = new THREE.WebGLRenderer({canvas:cv, antialias:true, alpha:true,
                                       powerPreference:'high-performance'});
  rnd.setPixelRatio(Math.min(devicePixelRatio||1, 1.8));
  rnd.outputEncoding = THREE.sRGBEncoding;
  rnd.localClippingEnabled = true;
  THREE.Object3D.DefaultUp.set(0,0,1);          // el DWG trabaja con Z arriba

  /* --- plano de corte ------------------------------------------------------
     Quitar los muros no basta: el techo sigue tapando la sala desde arriba, y
     no es una capa suya que se pueda apagar — va con la estructura. Así que se
     corta por altura, como en el configurador: normal hacia abajo y constante
     en milímetros, de modo que sobrevive lo que está por debajo de esa cota.
     3003 mm sobre un módulo de 3100 deja fuera la cubierta y nada más.
     El corte se anima en vez de conmutarse: bajar el plano disuelve el techo de
     arriba abajo, y subirlo lo devuelve. FUERA lo aparta por encima de todo lo
     que puede haber en escena — tres módulos apilados son 9,3 m. */
  const CORTE_Z = 3003, FUERA = 60000;
  const corte = new THREE.Plane(new THREE.Vector3(0,0,-1), CORTE_Z);
  const cut = {z:CORTE_Z};

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x020D1F, 26000, 92000);
  const cam = new THREE.PerspectiveCamera(34, 1, 60, 400000);
  const raiz = new THREE.Group(); scene.add(raiz);

  scene.add(new THREE.HemisphereLight(0xBFD4F2, 0x0A1424, 1.15));
  const key = new THREE.DirectionalLight(0xFFF1E2, 1.45); key.position.set(1,.5,1.3); scene.add(key);
  const fil = new THREE.DirectionalLight(0x6FA6E8, .70); fil.position.set(-1.2,-.6,.5); scene.add(fil);
  const rim = new THREE.DirectionalLight(0xE4622A, .38); rim.position.set(.1,-1.3,-.35); scene.add(rim);

  /* --- estado de cámara: un rig esférico que GSAP interpola --- */
  const C = {tx:0, ty:0, tz:0, r:24000, th:-38, ph:20};
  const centro = new THREE.Vector3();
  function situar(){
    const th = C.th*Math.PI/180, ph = C.ph*Math.PI/180, cp = Math.cos(ph);
    const tx = centro.x+C.tx, ty = centro.y+C.ty, tz = centro.z+C.tz;
    cam.position.set(tx + C.r*cp*Math.cos(th), ty + C.r*cp*Math.sin(th), tz + C.r*Math.sin(ph));
    cam.up.set(0,0,1);
    cam.lookAt(tx,ty,tz);
    /* La columna de texto ocupa el 40 % izquierdo, así que el modelo no puede
       quedar centrado. Se desplaza la cámara sobre su propio eje horizontal
       después del lookAt: la dirección de vista no cambia y el sujeto se corre
       a la derecha del encuadre. En pantalla estrecha el texto va debajo y no
       hace falta. */
    if (innerWidth > 1080) cam.translateX(-C.r*0.15);

    /* la niebla acompaña al radio: fijarla en metros absolutos hundía el
       conjunto grande y dejaba el módulo suelto sin profundidad */
    scene.fog.near = C.r*0.55;
    scene.fog.far  = C.r*2.6;
  }

  let reencuadrar = null;
  function medir(){
    const w = cv.clientWidth || 1, h = cv.clientHeight || 1;
    rnd.setSize(w,h,false);
    cam.aspect = w/h; cam.updateProjectionMatrix();
    if (reencuadrar) reencuadrar();      // el radio depende del aspecto
  }
  addEventListener('resize', medir);

  /* --- descarga con progreso -----------------------------------------------
     Dos cosas se tuercen fuera de un servidor normal y las dos daban el mismo
     mensaje genérico. Con `file://` fetch ni sale, y algunos servidores
     estáticos mandan los .gz con `Content-Encoding: gzip`: el navegador ya los
     descomprime y lo que llega aquí no es gzip. Por eso se mira el número
     mágico en vez de suponerlo. */
  async function traer(url, desde, hasta, total){
    const res = await fetch(url);
    if(!res.ok) throw new Error(url+' → '+res.status);
    const len = +(res.headers.get('content-length')||total) || total;
    const rd = res.body.getReader();
    const trozos = []; let leido = 0;
    for(;;){
      const {done, value} = await rd.read();
      if(done) break;
      trozos.push(value); leido += value.length;
      progreso(desde + (hasta-desde)*Math.min(1, leido/len));
    }
    const todo = new Uint8Array(leido); let o=0;
    for(const t of trozos){ todo.set(t,o); o+=t.length; }
    return desinflar(todo);
  }

  async function desinflar(u8){
    if (u8[0] !== 0x1f || u8[1] !== 0x8b) return u8;   // el servidor ya lo desinfló
    if (typeof DecompressionStream === 'undefined')
      throw new Error('este navegador no trae DecompressionStream');
    const st = new Blob([u8]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Uint8Array(await new Response(st).arrayBuffer());
  }

  /* --- el mismo modelo, pero dentro de la página --------------------------
     Abierta con doble clic, `file://` bloquea fetch y no llega nada: el
     recorrido se quedaba en el aviso de error. Un <script src> no tiene esa
     restricción, así que el par de .gz va también en base64 en
     assets/shelter/model-embed.js (3,1 MB, lo genera scripts/embed-shelter-asset.js).
     Se pide solo cuando el camino bueno falla: sobre un servidor no se descarga
     nunca, y así la barra de progreso sigue siendo real y el modelo se cachea. */
  function embebido(){
    if (window.SHELTER_MODEL) return Promise.resolve(window.SHELTER_MODEL);
    return new Promise((ok, mal)=>{
      const sc = document.createElement('script');
      sc.src = 'assets/shelter/model-embed.js';
      sc.onload  = ()=> window.SHELTER_MODEL ? ok(window.SHELTER_MODEL)
                                             : mal(new Error('model-embed.js no definió el modelo'));
      sc.onerror = ()=> mal(new Error('falta assets/shelter/model-embed.js — córrelo con node scripts/embed-shelter-asset.js'));
      document.head.appendChild(sc);
    });
  }
  /* atob deshace el base64 de una pasada en C++; el bucle solo copia los
     códigos a un tipado, que es lo que espera el resto. */
  function deB64(str){
    const bin = atob(str), u = new Uint8Array(bin.length);
    for (let i=0;i<bin.length;i++) u[i] = bin.charCodeAt(i);
    return u;
  }
  function progreso(p){
    bar.style.transform = 'scaleX('+p.toFixed(3)+')';
    bpc.textContent = Math.round(p*100)+' %';
  }

  let grupos = [];            // una InstancedMesh por pieza del DWG
  let materiales = [];        // {capa, m, op} únicos: la opacidad se anima aquí
  let PITCH = 5960, ALTO = 3100, UNIT = null;

  /* Encuadre calculado, no a ojo. El radio salía de números escritos a mano y
     no cuadraba: con cuatro módulos adosados la cámara se metía entre los
     techos. Ahora se mide la esfera que envuelve al conjunto y se retrocede lo
     justo para que quepa en el menor de los dos ángulos de visión — que en
     pantalla apaisada es el vertical, y en móvil el horizontal. */
  const EXT = {w:28600, d:21900, h:4300};   // lo que ocupa un módulo con sus patios
  function radioAjuste(nx, nz, k){
    /* La huella que hay que encuadrar no es la del shelter (5,96 × 10,20) sino
       la de todo lo que trae el DWG: los dos patios de condensadoras y sus
       losas llevan el conjunto a 28,6 × 21,9 m. Midiendo solo el shelter, la
       esfera salía a la mitad y la cámara se metía entre los techos. */
    const W = EXT.w + (nx-1)*PITCH;
    const D = EXT.d;
    const H = EXT.h + (nz-1)*ALTO;
    const r = Math.sqrt(W*W + D*D + H*H)*.5;
    const fv = cam.fov*Math.PI/180;
    const fh = 2*Math.atan(Math.tan(fv/2)*cam.aspect);
    return k * r / Math.sin(Math.max(.25, Math.min(fv,fh))/2);
  }
  /* y el centro se corre con las copias, que si no el conjunto crece hacia un
     lado y la cámara se queda mirando al módulo original */
  function centroDe(nx, nz){
    return {x:(nx-1)*PITCH/2, z:(nz-1)*ALTO/2};
  }
  const LAYOUT = {nx:1, nz:1};
  const MAXI = 8;

  /* Coloca las copias. `t` va de 0 a 1 y sirve para que las nuevas entren
     deslizándose desde el módulo base en vez de aparecer de golpe.

     Cada pieza ya viene instanciada por el DWG —un rack y veinte matrices, no
     veinte racks— así que aquí hay dos niveles: la copia del módulo multiplica
     a la instancia de la pieza. Como la copia es una traslación pura, componer
     las dos es sumarle el desplazamiento a la columna de traslación de la
     matriz del nodo; no hace falta multiplicar matrices. Se escribe directo
     sobre el array de la InstancedMesh porque setMatrixAt pasa por un Matrix4
     intermedio y aquí son doce mil por fotograma mientras dura la transición. */
  function colocar(nx, nz, t){
    const copias = nx*nz;
    for (const g of grupos){
      const m = g.userData.mats, n = g.userData.inst, a = g.instanceMatrix.array;
      let c = 0;
      for (let z=0; z<nz; z++) for (let x=0; x<nx; x++, c++){
        const k = Math.min(1, Math.max(0, t*1.35 - c*.05));
        const e = 1-Math.pow(1-k,3);
        const dx = x*PITCH*e, dz = z*ALTO*e;
        for (let j=0; j<n; j++){
          const o = (c*n + j)*16, u = j*12;
          a[o   ] = m[u  ]; a[o+1 ] = m[u+1 ]; a[o+2 ] = m[u+2 ]; a[o+3 ] = 0;
          a[o+4 ] = m[u+3]; a[o+5 ] = m[u+4 ]; a[o+6 ] = m[u+5 ]; a[o+7 ] = 0;
          a[o+8 ] = m[u+6]; a[o+9 ] = m[u+7 ]; a[o+10] = m[u+8 ]; a[o+11] = 0;
          a[o+12] = m[u+9] + dx; a[o+13] = m[u+10]; a[o+14] = m[u+11] + dz; a[o+15] = 1;
        }
      }
      g.count = copias * n;
      g.instanceMatrix.needsUpdate = true;
    }
  }

  const tran = {t:1};
  function disponer(nx, nz){
    if (nx===LAYOUT.nx && nz===LAYOUT.nz) return;
    LAYOUT.nx = nx; LAYOUT.nz = nz;
    if (RM){ colocar(nx,nz,1); return; }
    tran.t = 0;
    gsap.killTweensOf(tran);
    gsap.to(tran,{t:1, duration:1.15, ease:'power2.out',
      onUpdate:()=>colocar(nx,nz,tran.t), onComplete:()=>colocar(nx,nz,1)});
  }

  /* Realce de capas: la que toca se queda entera y el resto baja a un fantasma.
     No se ocultan del todo a propósito — el contexto de la sala es la mitad de
     la información.

     La opacidad se anima por material (79) y la visibilidad por malla (219). Un
     material pertenece siempre a una sola capa —la clave la incluye— así que
     ninguna capa pisa la opacidad de otra. */
  let pase = 0;
  function capas(modo){
    const s = SETS[modo] || null;
    const mio = ++pase;      // si llega otro paso antes de los .9 s, el viejo no apaga nada
    const fuera = cap => !!(s && s.ocultar && s.ocultar.indexOf(cap) >= 0);

    materiales.forEach(({capa, m, op:base})=>{
      if (APAGADAS.indexOf(capa) >= 0) return;
      let op = base;
      if (fuera(capa)) op = 0;
      else if (s && s.realzar) op = s.realzar.indexOf(capa) >= 0 ? base : base*.10;
      /* `transparent` es estado de compilación del shader, no un número: hay que
         avisar con needsUpdate al entrar y al salir del velo. */
      gsap.to(m, {opacity:op, duration:.9, ease:'power2.out', overwrite:true,
        onStart:()=>{ if(!m.transparent){ m.transparent = true; m.needsUpdate = true; } },
        onUpdate:()=>{ m.depthWrite = m.opacity > .92; },
        onComplete:()=>{ if(m.opacity >= 1 && m.transparent){ m.transparent = false; m.needsUpdate = true; } }});
    });

    grupos.forEach(g=>{
      const cap = g.userData.capa;
      if (APAGADAS.indexOf(cap) >= 0){ g.visible = false; return; }
      if (fuera(cap)) gsap.delayedCall(.9, ()=>{ if (mio === pase) g.visible = false; });
      else g.visible = true;
    });
  }

  /* Altura de corte del paso. Los pasos apilados lo apartan: un plano en cota
     absoluta que decapita al módulo de abajo le borra enteros los de arriba. */
  function cortar(z){
    gsap.killTweensOf(cut);
    if (RM){ cut.z = z; corte.constant = z; return; }
    gsap.to(cut,{z, duration:1.2, ease:'power2.inOut',
      onUpdate:()=>{ corte.constant = cut.z; }});
  }

  /* --- lecturas del HUD --- */
  function hud(el){
    hudK.innerHTML = el.dataset.k || '';
    hudV.innerHTML = el.dataset.v || '';
    hudF.innerHTML = (el.dataset.fig||'').split(';').filter(Boolean).map(f=>{
      const [n,t] = f.split('|');
      return '<div class="f"><b>'+n+'</b><span>'+(t||'')+'</span></div>';
    }).join('');
    gsap.from('.hud-r .f',{y:14, opacity:0, duration:.6, stagger:.06});
    gsap.from([hudK,hudV],{y:10, opacity:0, duration:.6, stagger:.05});
  }

  /* --- arranque --- */
  (async function(){
    try{
      medir();
      let mj, mb;
      try{
        mj = await traer('assets/shelter/model.json.gz', 0, .06, 4200);
        mb = await traer('assets/shelter/model.bin.gz',  .06, 1, 2403718);
      } catch(sinRed){
        /* Sin servidor no hay descarga que medir: el <script> ya cuenta como el
           grueso de la espera, así que la barra salta y el resto es descodificar. */
        console.info('shelter 3D: sin fetch (' + sinRed.message + '), tirando del modelo embebido');
        progreso(.35);
        const em = await embebido();
        progreso(.7);
        mj = await desinflar(deB64(em.json));
        mb = await desinflar(deB64(em.bin));
        window.SHELTER_MODEL = null;      // 3 MB de cadena que ya no hacen falta
        progreso(1);
      }
      const meta = JSON.parse(new TextDecoder().decode(mj));
      const buf = mb.buffer;

      /* posiciones: uint16 sobre la caja de los prototipos → float32 en mm */
      const q = new Uint16Array(buf, 0, meta.off.T/2);
      const pos = new Float32Array(q.length);
      const mn = meta.quant.min, es = meta.quant.esc;
      for (let i=0;i<q.length;i+=3){
        pos[i]   = mn[0] + q[i]  *es[0];
        pos[i+1] = mn[1] + q[i+1]*es[1];
        pos[i+2] = mn[2] + q[i+2]*es[2];
      }
      const attr = new THREE.BufferAttribute(pos,3);   // compartido por todas las piezas
      /* las matrices de nodo, 12 float por instancia: 3x3 de giro y traslación */
      const MAT = new Float32Array(buf, meta.off.M, (buf.byteLength-meta.off.M)/4);

      /* Una malla por pieza, y no fundidas por capa y color como antes.
         Fundirlas exigía una sola geometría por grupo, y eso solo vale si todas
         comparten colocación — aquí cada pieza trae su propia lista de matrices.
         Son 219 llamadas de dibujo en vez de sesenta, pero el número no crece
         con las copias del módulo: los ocho módulos del último paso siguen
         siendo 219, con ocho veces más instancias dentro. */

      /* El material sí se comparte entre piezas de la misma capa, color y alfa:
         quedan 79 en vez de 219, y `capas()` anima 79 tweens en vez de 219. */
      const paleta = new Map();
      function material(p, cap){
        const k = cap+'|'+p.c+'|'+p.a+'|'+(p.g?'g':'');
        let m = paleta.get(k);
        if (m) return m;
        /* El DWG trae alfas de plano: los gabinetes a 0,83 y la losa del piso a
           0,75 no son vidrio, es el sombreado del render de AutoCAD, y ahí
           dentro se comen el volumen de la sala. Por debajo de 0,6 sí hay
           intención —vidrio, zonas de detección, la losa del terreno— y se
           respeta; por encima se opaca. Lo opaco entra opaco de verdad: con
           `transparent` activo se resolvía todo en la pasada de transparencias,
           sin z-buffer fiable, y la sala se leía como una radiografía. El velo
           de las capas en segundo plano lo enciende `capas()` cuando hace falta. */
        const op = p.a < .6 ? p.a : 1;
        m = new THREE.MeshStandardMaterial({
          color:tinte(p.c, cap, p.g), roughness:.62, metalness:.20,
          side:THREE.DoubleSide, flatShading:true,
          transparent:op<1, opacity:op, depthWrite:true,
          clippingPlanes:[corte]
        });
        m.userData = {op};
        paleta.set(k, m);
        materiales.push({capa:cap, m, op});
        return m;
      }

      for (const p of meta.parts){
        const cap = meta.layers[p.l];
        /* slice y no una vista: los offsets del blob no están alineados a 4 y
           un Uint32Array sobre el buffer reventaría */
        const src = p.w===2 ? new Uint16Array(buf.slice(meta.off.T+p.to, meta.off.T+p.to+p.tn*2))
                            : new Uint32Array(buf.slice(meta.off.T+p.to, meta.off.T+p.to+p.tn*4));
        const idx = new Uint32Array(p.tn);
        for (let i=0;i<src.length;i++) idx[i] = src[i] + p.vo;   // a índice global

        const g = new THREE.BufferGeometry();
        g.setAttribute('position', attr);
        g.setIndex(new THREE.BufferAttribute(idx,1));
        /* Sin normales a propósito. Con flatShading el shader las deriva del
           propio triángulo, y calcularlas por pieza significaría un atributo del
           tamaño de TODO el modelo en cada una de las 219. */

        const im = new THREE.InstancedMesh(g, material(p, cap), p.in * MAXI);
        im.userData = {capa:cap, op:material(p,cap).userData.op,
                       mats:MAT.subarray(p.io*12, (p.io+p.in)*12), inst:p.in};
        im.visible = APAGADAS.indexOf(cap) < 0;
        im.frustumCulled = false;
        im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        raiz.add(im); grupos.push(im);
      }

      PITCH = meta.unit.w; ALTO = meta.unit.h; UNIT = meta.unit;
      /* La huella del conjunto viene medida del empaquetado, con las matrices
         puestas. Deducirla del rango de cuantización ya no vale: ese rango es
         el de los prototipos —un rack de 80 cm— y no el de la parcela. */
      EXT.w = meta.ext.w; EXT.d = meta.ext.d; EXT.h = meta.ext.h;
      /* El encuadre se centra en el shelter, no en la caja de todo lo cargado:
         los patios de condensadoras y sus losas se extienden mucho hacia los
         lados y tiraban del centro fuera del módulo. */
      const U = meta.unit;
      centro.set((U.x0+U.x1)/2, (U.y0+U.y1)/2, (U.z0+U.z1)/2);
      colocar(1,1,1);
      situar();

      box.classList.add('off');
      gsap.from(raiz.scale,{x:.92,y:.92,z:.92,duration:1.6,ease:'expo.out'});

      /* el barrido de cambio de paso; si llega otro antes, reinicia */
      function barrido(){
        var sw = document.querySelector('.walk-sw'); if (!sw || RM) return;
        gsap.fromTo(sw, {opacity:0, xPercent:-55}, {opacity:1, xPercent:0, duration:.5, ease:'power2.out',
          overwrite:true, onComplete:function(){ gsap.to(sw, {opacity:0, xPercent:55, duration:.7, ease:'power2.in'}); }});
      }

      /* --- cada paso mueve la cámara, las capas y el número de copias --- */
      pasos.forEach(el=>{
        const [tg, k, th, ph] = (el.dataset.cam||'0,0,0|1.15|-38|20').split('|');
        const [ox,oy,oz] = tg.split(',').map(Number);
        const cp = el.dataset.copies || '';
        const nx = /x(\d)/.test(cp) ? +cp.match(/x(\d)/)[1] : 1;
        const nz = /z(\d)/.test(cp) ? +cp.match(/z(\d)/)[1] : 1;
        const entrar = ()=>{
          const c = centroDe(nx,nz);
          gsap.to(C,{tx:ox+c.x, ty:oy, tz:oz+c.z, r:radioAjuste(nx,nz,+k),
                     th:+th, ph:+ph, duration:1.8, ease:'power2.inOut', overwrite:true});
          capas(el.dataset.layers||'all');
          const dc = el.dataset.cut;
          cortar(dc === 'off' ? FUERA : (dc ? +dc : CORTE_Z));
          disponer(nx,nz);
          hud(el);
          reencuadrar = ()=>{ C.r = radioAjuste(nx,nz,+k); };
        };
        ScrollTrigger.create({trigger:el, start:'top 62%', end:'bottom 38%',
          onEnter:function(){ entrar(); barrido(); },
          onEnterBack:function(){ entrar(); barrido(); }});
      });

      /* --- el fondo técnico: retícula, marca y barrido ---------------------
         El lienzo dejaba media pantalla de navy vacío. Estas capas de CSS van
         detrás del 3D (el renderer es transparente) y se mueven con el scroll a
         distinta velocidad: la retícula poco, la marca el doble. El barrido
         cruza cada vez que cambia el paso, como el refresco de un plano. */
      var rej = document.querySelector('.walk-bg .rej');
      if (rej) gsap.fromTo(rej, {yPercent:-3, xPercent:-1.5}, {yPercent:3, xPercent:1.5,
        ease:'none', scrollTrigger:{trigger:'#walk', start:'top bottom', end:'bottom top', scrub:1.1}});

      /* pintar solo mientras la pasarela está a la vista */
      let viva = false;
      ScrollTrigger.create({trigger:'#walk', start:'top bottom', end:'bottom top',
        onToggle:st=>{ viva = st.isActive; }});
      gsap.ticker.add(()=>{ if(!viva) return; situar(); rnd.render(scene,cam); });

      ScrollTrigger.refresh();
    } catch(err){
      console.warn('shelter 3D:', err);
      /* Llegar aquí ya cuesta: han fallado el fetch y el modelo embebido. Queda
         el navegador —sin WebGL o sin DecompressionStream— o que falte el
         propio model-embed.js, que no está en el repo hasta que se genera. */
      box.innerHTML = '<span class="lbl">No se pudo cargar el modelo</span>'
        + '<p class="bd-s" style="text-align:center;max-width:38ch">'
        + 'El recorrido necesita WebGL y un navegador con soporte de descompresión. '
        + 'La ficha técnica del módulo sigue más abajo.'
        + '</p><p class="bd-s" style="text-align:center;opacity:.5;max-width:38ch">'
        + (err && err.message ? String(err.message) : String(err)) + '</p>';
    }
  })();
})();

/* La cabecera sobre fondo claro. Antes se resolvia sola con
   `mix-blend-mode:difference`; ahora que el color es explicito —para poder
   llevar el logo en color de marca— hay que decirle donde esta.
   Se cuenta en vez de conmutar: los tramos claros pueden solaparse en un
   refresh, y con un booleano el ultimo en salir apagaria el que sigue activo. */
(function(){
  var hd = document.getElementById('hd'); if (!hd || typeof ScrollTrigger === 'undefined') return;
  var n = 0, BORDE = 74;                 // alto util de la cabecera, en px
  function marca(activo){
    n = Math.max(0, n + (activo ? 1 : -1));
    hd.classList.toggle('lite', n > 0);
  }
  document.querySelectorAll('.on-light').forEach(function(sec){
    ScrollTrigger.create({trigger:sec, start:'top '+BORDE, end:'bottom '+BORDE,
      onToggle:function(st){ marca(st.isActive); }});
  });
  /* La puerta no es `.on-light`, pero su fondo se vuelve blanco a partir del
     tercio del recorrido, que es cuando la camara termina de cruzar. */
  var door = document.getElementById('door');
  if (door) ScrollTrigger.create({trigger:door, start:'32% '+BORDE, end:'bottom '+BORDE,
    onToggle:function(st){ marca(st.isActive); }});
})();
