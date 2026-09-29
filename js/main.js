const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TOUCH = matchMedia('(hover:none),(pointer:coarse)').matches;
gsap.registerPlugin(ScrollTrigger);
gsap.defaults({ease:'power3.out'});

/* ---------- smooth scroll ---------- */
let ln = null;
if (!RM && typeof Lenis !== 'undefined'){
  ln = new Lenis({duration:1.25, smoothWheel:true, touchMultiplier:1.7});
  ln.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => ln.raf(t*1000));
  gsap.ticker.lagSmoothing(0);
}
const to = s => ln ? ln.scrollTo(s,{duration:1.5}) : document.querySelector(s)?.scrollIntoView({behavior:'smooth'});

/* ============================================================
   SPLIT: líneas reales (medidas tras el layout)
   ============================================================ */
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
  // agrupar por top
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
function doSplits(){
  document.querySelectorAll('[data-split="line"]').forEach(el=>{
    if (splitMap.has(el)) return;
    splitMap.set(el, splitLines(el));
  });
}
doSplits();

/* ============================================================
   PRELOADER
   ============================================================ */
document.body.classList.add('lock');
const pre = document.getElementById('pre'), pc = pre.querySelector('.pc'), pb = pre.querySelector('.bar > i');
const cnt = {v:0};

function heroIn(){
  const t = gsap.timeline();
  /* el zoom de entrada va sobre .mv, no sobre el <video>: el parallax de scroll
     usa el <video> y si compartieran transform se anularian entre si */
  t.from('#hero .mv', {scale:1.22, duration:2.4, ease:'power2.out'}, 0)
   .from('#hero .tag', {yPercent:120, opacity:0, duration:1}, .1)
   .from(splitMap.get(document.querySelector('#hero h1')) || [], {yPercent:112, duration:1.35, stagger:.09, ease:'expo.out'}, .2)
   .from('#hero .lo', {y:40, opacity:0, duration:1.1}, .7)
   .from('#hd, #sc', {opacity:0, duration:.9}, .6)
   .to('#ch', {opacity:1, duration:.8}, .9);
  gsap.to('#ck', {y:0, duration:1, delay:3, ease:'power3.out'});
}

gsap.timeline({onComplete:()=>{document.body.classList.remove('lock'); heroIn(); ScrollTrigger.refresh();}})
  .to(cnt, {v:100, duration:2, ease:'power2.inOut', onUpdate:()=>pc.textContent=Math.round(cnt.v)}, 0)
  .to(pb, {scaleX:1, duration:2, ease:'power2.inOut'}, 0)
  .to('#pre .word, #pre .pc, #pre .top', {opacity:0, y:-18, duration:.55, stagger:.04}, '>-.05')
  .to(pre, {yPercent:-101, duration:1.1, ease:'expo.inOut'}, '>-.15')
  .set(pre, {display:'none'});

/* ============================================================
   HEADER / MENU / CAPÍTULO
   ============================================================ */
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
  /* el reflejo del marco perla del hero avanza con el scroll */
  document.documentElement.style.setProperty('--hs', (120 - (y * .12) % 240) + '%');
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
  if (open){ mtl.play(); ln&&ln.stop(); } else { mtl.reverse(); ln&&ln.start(); gsap.delayedCall(.95,()=>{ if(!open) gsap.set(mn,{visibility:'hidden'}); }); }
}
bgB.addEventListener('click',()=>tog());
mLinks.forEach(a=>a.addEventListener('click',e=>{e.preventDefault(); const t=a.getAttribute('href'); tog(false); gsap.delayedCall(.6,()=>to(t));}));
addEventListener('keydown',e=>{ if(e.key==='Escape'&&open) tog(false); });
document.querySelectorAll('a[href^="#"]:not(#mn a)').forEach(a=>a.addEventListener('click',e=>{
  const t=a.getAttribute('href'); if(t.length>1&&document.querySelector(t)){e.preventDefault(); to(t);}
}));

/* contador de capítulo */
const chI = document.querySelector('#ch .c i'), chN = document.getElementById('chn');
document.querySelectorAll('[data-ch]').forEach(s=>{
  ScrollTrigger.create({trigger:s, start:'top 55%', end:'bottom 55%',
    onToggle:st=>{ if(st.isActive){
      if (chI.textContent !== s.dataset.ch){
        gsap.to(chI,{yPercent:-100,duration:.3,ease:'power2.in',onComplete:()=>{
          chI.textContent = s.dataset.ch; gsap.fromTo(chI,{yPercent:100},{yPercent:0,duration:.4,ease:'power2.out'});
        }});
      }
      chN.textContent = s.dataset.nm;
    }}});
});

/* ============================================================
   HERO → 00B: la seccion siguiente sube y tapa un hero quieto
   ------------------------------------------------------------
   Todo se mide sobre #intro, no sobre #hero: el hero es sticky y ScrollTrigger
   leeria su posicion pegada, no la real. #intro va justo despues de una pantalla
   completa, asi que su recorrido de 'top bottom' a 'top top' es exactamente el
   0 → 1 del cruce entre las dos secciones.
   ============================================================ */
const intro = document.getElementById('intro');
const hvid  = document.querySelector('#hero .bgm video');

if (intro){
  /* Dos recorridos distintos, y la diferencia importa:

     `abre()` es el tramo en el que el hero esta quieto y solo pasa lo suyo — el
     barrido de rayos X y la apertura del marco. Va sobre `.cover` desde arriba y
     dura lo que mide el tramo de espera.

     `cover()` es el cruce: cuando la seccion siguiente sube y tapa al hero. Ahi
     el texto se adelanta y se apaga y el velo lo lleva a negro.

     Antes todo colgaba de `cover()`, y por eso el efecto se ejecutaba a la vez
     que el tapado: pasaba de golpe. */
  const hold  = document.querySelector('.cover .hold');
  const capa  = document.querySelector('.cover');
  const abre  = () => ({trigger:capa, start:'top top',
    end:() => '+=' + (hold ? hold.offsetHeight : innerHeight),
    scrub:.6, invalidateOnRefresh:true});
  const cover = () => ({trigger:intro, start:'top bottom', end:'top top', scrub:true});

  if (!RM){
    /* el hero se hunde: el video sigue subiendo un poco (parallax), el texto se
       adelanta y se apaga, y el velo lo lleva casi a negro antes de quedar tapado */
    /* --- el tramo propio del hero: barrido y apertura --- */
    gsap.timeline({scrollTrigger:abre(), defaults:{ease:'none'}})
      /* el barrido de rayos X ocupa el grueso del tramo, que es lo que hay que
         mirar; el marco se abre algo antes para no competir con el */
      .fromTo('#hero', {'--wp':0}, {'--wp':100, duration:.82}, 0)
      .fromTo('#hero', {'--hx':1}, {'--hx':0,   duration:.52}, 0)
      /* Las dos fotos en un solo tween: mismos valores, asi que se mueven
         exactamente igual y el corte del barrido sigue casando. Separarlas seria
         ver dos edificios desalineados. */
      .fromTo('#hero .ph', {yPercent:0, scale:1}, {yPercent:5, scale:1.08, duration:1}, 0);

    /* --- el cruce: la seccion siguiente sube y lo tapa --- */
    gsap.timeline({scrollTrigger:cover(), defaults:{ease:'none'}})
      .fromTo('#hero .ph', {yPercent:5}, {yPercent:11, duration:1}, 0)
      .fromTo('#hero .in',        {yPercent:0}, {yPercent:-15, duration:1}, 0)
      /* el texto se apaga en la primera mitad del cruce: si llegara vivo al
         borde de la seccion que sube, el titular se veria cortado a media
         palabra y eso se lee como recorte, no como profundidad */
      .fromTo('#hero .in',        {opacity:1}, {opacity:0, duration:.38}, 0)
      .fromTo('#hero .dim',       {opacity:0}, {opacity:.92, duration:.82}, 0);

    /* Paralaje por capas dentro del hero. El titular se mueve por sus MASCARAS
       —los `.ln`— y no por el texto de dentro: eso ultimo es lo que anima el
       revelado de entrada, y dos animaciones sobre el mismo elemento se pisan.
       Cada linea viaja mas que la de encima y el pie mas que todas, asi que el
       bloque se abre al bajar en vez de subir en plancha. Va aparte del timeline
       porque `#hero .in` ya lleva su propio yPercent y estos suman encima. */
    var capas = [['#hero .tag', -14]];
    [].forEach.call(document.querySelectorAll('#hero h1 .ln'), function(l, i){
      capas.push([l, -(24 + i*20)]);
    });
    capas.push(['#hero .lo', -64]);
    capas.forEach(function(c){
      gsap.fromTo(c[0], {y:0}, {y:c[1], ease:'none', scrollTrigger:cover()});
    });

    /* aparte del timeline y con immediateRender:false: si renderizara en el
       progreso 0 fijaria opacity:1 y se comeria el fundido de entrada de #sc */
    gsap.to('#sc', {opacity:0, ease:'none', immediateRender:false,
      scrollTrigger:{trigger:intro, start:'top bottom', end:'top 72%', scrub:true}});

    /* el horizonte: enciende mientras cruza la pantalla y se apaga al llegar
       arriba, cuando ya no hay hero debajo que separar */
    /* La luz se enciende al bajar y se abre. Va de un nucleo estrecho y apagado
       a un halo ancho a plena intensidad, y despues se disuelve estirandose:
       primero se enciende, luego se difumina. El scrub la deja en manos del
       dedo, asi que se puede parar a media ignicion. */
    const sm = intro.querySelector('.seam > i');
    if (sm) gsap.timeline({scrollTrigger:cover(), defaults:{ease:'none'}})
      .fromTo(sm, {opacity:0, scaleX:.62, scaleY:.34},
                  {opacity:1, scaleX:1,   scaleY:1,   duration:.58})
      .to(sm,     {opacity:0, scaleX:1.1, scaleY:1.9, duration:.42});

    /* La imagen ancha no lleva tween propio en el cruce a proposito. El
       movimiento ya se lo da el yPercent con scrub de .med.wide, y meterle aqui
       una escala la dejaba a merced del overwrite:'auto' de data-tilt, que borra
       cualquier tween de scale/x/y sobre el <img> en cuanto pasa el puntero. */
  }

  /* una vez tapado, el hero no tiene por que seguir componiendose ni el video
     decodificando cuadros detras de toda la pagina */
  ScrollTrigger.create({trigger:intro, start:'top top',
    onEnter:    ()=>{ gsap.set('#hero',{visibility:'hidden'}); hvid && hvid.pause(); },
    onLeaveBack:()=>{ gsap.set('#hero',{visibility:'visible'}); hvid && hvid.play().catch(()=>{}); }});
}

/* El barrido del brillo. Va atado al scroll y no a un temporizador: el destello
   cae cuando la pieza cruza la pantalla, que es cuando se la esta mirando.
   `--sheen` solo mueve la posicion del degradado, asi que el navegador recompone
   el relleno del texto y no vuelve a maquetar nada. */
function brillo(sel){
  document.querySelectorAll(sel).forEach(el=>{
    if (el.dataset.gl) return; el.dataset.gl='1';
    if (RM){ el.style.setProperty('--sheen','50%'); return; }
    gsap.fromTo(el, {'--sheen':'150%'}, {'--sheen':'-50%', ease:'none',
      scrollTrigger:{trigger:el, start:'top 96%', end:'bottom 24%', scrub:.7}});
  });
}

/* ============================================================
   REVEALS
   ============================================================ */
function bindReveals(){
  brillo('.ln > i em');
  brillo('.figs .f .num');
  document.querySelectorAll('[data-split="line"]').forEach(el=>{
    if (el.closest('#hero') || el.dataset.bound) return;
    el.dataset.bound='1';
    gsap.from(splitMap.get(el)||[], {yPercent:112, duration:1.15, stagger:.075, ease:'expo.out',
      scrollTrigger:{trigger:el, start:'top 87%'}});
  });
  document.querySelectorAll('[data-anim="up"]').forEach(el=>{
    if (el.closest('#hero') || el.dataset.bound) return;
    el.dataset.bound='1';
    gsap.from(el,{y:38, opacity:0, duration:1.1, ease:'power3.out', scrollTrigger:{trigger:el, start:'top 92%'}});
  });
  document.querySelectorAll('.lbl:not([data-bound])').forEach(el=>{
    /* `#door` va fuera como el hero y el menu: tiene su propia coreografia. Su
       etiqueta vive dentro de una seccion pegada y en posicion absoluta, asi que
       el disparador de aqui —'top 94%'— nunca llega a resolverse: el `from`
       dejaba la opacidad en 0 y encima competia con el tween de la puerta. */
    if (el.closest('#hero')||el.closest('#pre')||el.closest('#mn')||el.closest('#door')) return;
    el.dataset.bound='1';
    gsap.from(el,{opacity:0, duration:.9, scrollTrigger:{trigger:el, start:'top 94%'}});
  });
  document.querySelectorAll('[data-anim="hair"]').forEach(el=>{
    if (el.dataset.bound) return; el.dataset.bound='1';
    gsap.to(el,{scaleX:1, duration:1.3, ease:'expo.out', scrollTrigger:{trigger:el, start:'top 92%'}});
  });
  document.querySelectorAll('[data-med]').forEach(el=>{
    if (el.dataset.bound) return; el.dataset.bound='1';
    const m = el.querySelector('img,video');
    gsap.fromTo(el,{clipPath:'inset(0 0 100% 0)'},{clipPath:'inset(0 0 0% 0)',duration:1.5,ease:'expo.out',
      scrollTrigger:{trigger:el, start:'top 88%'}});
    gsap.fromTo(m,{scale:1.35},{scale:1,duration:1.7,ease:'expo.out',scrollTrigger:{trigger:el,start:'top 88%'}});
    if (!el.classList.contains('st'))
      gsap.fromTo(m,{yPercent:-11},{yPercent:11,ease:'none',scrollTrigger:{trigger:el,start:'top bottom',end:'bottom top',scrub:true}});
  });
}
bindReveals();

/* -- paneles: revelado, barrido de luz e inclinacion 3D -- */
gsap.utils.toArray('.pnl .p').forEach(function(pn,i){
  var im = pn.querySelector('img'), sw = pn.querySelector('.swp');
  gsap.fromTo(pn, {clipPath:'inset(0 0 100% 0)'},
    {clipPath:'inset(0 0 0% 0)', duration:1.6, ease:'expo.out',
     scrollTrigger:{trigger:pn, start:'top 86%'}});
  gsap.fromTo(im, {scale:1.16}, {scale:1, duration:1.9, ease:'expo.out',
     scrollTrigger:{trigger:pn, start:'top 86%'}});
  /* la imagen se desplaza dentro del marco al hacer scroll */
  gsap.fromTo(im, {yPercent:-4}, {yPercent:4, ease:'none',
     scrollTrigger:{trigger:pn, start:'top bottom', end:'bottom top', scrub:1}});
  /* el reflejo barre el vidrio de lado a lado */
  gsap.fromTo(sw, {xPercent:-45}, {xPercent:45, ease:'none',
     scrollTrigger:{trigger:pn, start:'top bottom', end:'bottom top', scrub:1.4}});
  /* el titular sobrepuesto entra linea por linea, cada una con su tono */
  gsap.from(pn.querySelectorAll('.pt span > i'), {yPercent:112, duration:1.1, stagger:.12, ease:'expo.out',
     scrollTrigger:{trigger:pn, start:'top 78%'}});
  gsap.from(pn.querySelector('.pd'), {y:26, opacity:0, duration:1.1, ease:'power3.out',
     scrollTrigger:{trigger:pn, start:'top 70%'}});
  gsap.from(pn.querySelector('.scrim'), {opacity:0, duration:1.4, ease:'power2.out',
     scrollTrigger:{trigger:pn, start:'top 86%'}});
});

/* -- imagen ancha (.med.wide): un solo tween sobre el transform.
   Antes usaba data-med, que encima del parallax con scrub le montaba un
   segundo tween de escala con easing propio; los dos peleaban por el mismo
   transform y eso era el serpenteo. -- */
document.querySelectorAll('.med.wide').forEach(function(fr){
  var im = fr.querySelector('img');
  /* la del intro no lleva cortina: entra empujada por el cruce con el hero, y la
     cortina se gastaria estando aun fuera de pantalla */
  var enCruce = !!fr.closest('#intro');
  if (!enCruce) gsap.fromTo(fr, {clipPath:'inset(0 0 100% 0)'}, {clipPath:'inset(0 0 0% 0)',
    duration:1.4, ease:'expo.out', scrollTrigger:{trigger:fr, start:'top 88%'}});

  /* la imagen mide 126 % del alto del marco y arranca en top:-13 %, o sea 13 %
     de holgura arriba y abajo. Un viaje de +/-9 % consume 11,3 % de esa holgura:
     se mueve de verdad y nunca descubre el borde. El transform es solo de GSAP,
     el CSS no pone ninguno. */
  gsap.fromTo(im, {yPercent:-9}, {yPercent:9, ease:'none',
    scrollTrigger:{trigger:fr, start:'top bottom', end:'bottom top',
      scrub:1, invalidateOnRefresh:true}});

  /* durante el cruce la pieza llega a pantalla ya empezada: si el texto entra al
     72 % se dispara con media imagen aun por debajo del borde */
  var lns = fr.querySelectorAll('.vtx .pt span > i');
  if (lns.length) gsap.from(lns, {yPercent:112, duration:1.15, stagger:.13, ease:'expo.out',
    scrollTrigger:{trigger:fr, start:enCruce ? 'top 42%' : 'top 72%'}});
  var pd = fr.querySelector('.vtx .pd');
  if (pd) gsap.from(pd, {y:26, opacity:0, duration:1.1,
    scrollTrigger:{trigger:fr, start:enCruce ? 'top 34%' : 'top 64%'}});
  var gr = fr.querySelector('.vgr');
  if (gr) gsap.from(gr, {opacity:0, duration:1.4,
    scrollTrigger:{trigger:fr, start:'top 86%'}});
});

/* -- videos en marco (.vfr): el mismo tratamiento que las imagenes de .pnl —
   cortina, escala que se asienta, parallax interno y barrido de luz — mas el
   play solo mientras estan en pantalla, que es lo unico propio del video. -- */
document.querySelectorAll('.vfr').forEach(function(fr){
  var v = fr.querySelector('video'), sw = fr.querySelector('.swp');
  gsap.fromTo(fr, {clipPath:'inset(0 0 100% 0)'}, {clipPath:'inset(0 0 0% 0)',
    duration:1.4, ease:'expo.out', scrollTrigger:{trigger:fr, start:'top 86%'}});

  if (v){
    /* la imagen se asienta al entrar */
    gsap.fromTo(v, {scale:1.16}, {scale:1, duration:1.8, ease:'expo.out',
      scrollTrigger:{trigger:fr, start:'top 86%'}});
    /* y sigue viajando dentro del marco con el scroll. +/-4 % contra el 5 % de
       holgura que le da el CSS: se mueve y nunca descubre el borde.
       .st se salta el viaje: es el marco de VORTICE, una captura de pantalla a
       la que darle holgura le recortaria los paneles de la interfaz. */
    if (!fr.classList.contains('st'))
      gsap.fromTo(v, {yPercent:-4}, {yPercent:4, ease:'none',
        scrollTrigger:{trigger:fr, start:'top bottom', end:'bottom top',
          scrub:1, invalidateOnRefresh:true}});
  }
  /* el reflejo barre el vidrio de lado a lado */
  if (sw) gsap.fromTo(sw, {xPercent:-45}, {xPercent:45, ease:'none',
    scrollTrigger:{trigger:fr, start:'top bottom', end:'bottom top', scrub:1.4}});

  /* el texto sobrepuesto es opcional: el marco de VORTICE no lo lleva */
  var lns = fr.querySelectorAll('.vtx .pt span > i');
  if (lns.length) gsap.from(lns, {yPercent:112, duration:1.15, stagger:.13, ease:'expo.out',
    scrollTrigger:{trigger:fr, start:'top 74%'}});
  var pd = fr.querySelector('.vtx .pd');
  if (pd) gsap.from(pd, {y:26, opacity:0, duration:1.1,
    scrollTrigger:{trigger:fr, start:'top 66%'}});
  var gr = fr.querySelector('.vgr');
  if (gr) gsap.from(gr, {opacity:0, duration:1.4,
    scrollTrigger:{trigger:fr, start:'top 84%'}});

  if (!v) return;
  /* reproducir solo mientras la seccion esta a la vista, y reintentar si el
     navegador rechaza el autoplay (politica de autoplay, pestana en segundo
     plano o el archivo aun sin bufferear) */
  var visible = false;
  function tryPlay(){ if(!visible) return; var p = v.play(); if(p && p.catch) p.catch(function(){}); }
  v.addEventListener('canplay', tryPlay);
  v.addEventListener('loadeddata', tryPlay);
  v.addEventListener('error', function(){ console.warn('video sin cargar:', v.currentSrc, v.error); });
  document.addEventListener('pointerdown', tryPlay, {once:true});
  ScrollTrigger.create({trigger:fr, start:'top bottom', end:'bottom top',
    onToggle:function(st){ visible = st.isActive; if(visible){ tryPlay(); } else { v.pause(); } }});
});

/* inclinacion 3D con el puntero.
   data-tilt        -> rota el marco y mueve imagen y texto.
   data-tilt="flat" -> mueve imagen y texto, pero no rota el marco: una pieza a
                       sangre, al rotar en 3D, descubre el fondo por el borde
                       que se aleja.
   En ambos casos el texto se desplaza en sentido contrario a la imagen: ese
   contraste es el que da la sensacion de profundidad. */
if (!TOUCH){
  document.querySelectorAll('[data-tilt]').forEach(function(pn){
    /* img en paneles y tarjetas, video en los marcos .vfr */
    var im = pn.querySelector('img,video'), plano = pn.dataset.tilt === 'flat';
    /* .tx en paneles y tarjetas, .vtx en los marcos de video e imagen ancha */
    var tx = pn.querySelector('.tx') || pn.querySelector('.vtx');
    pn.addEventListener('mousemove', function(e){
      var r = pn.getBoundingClientRect();
      var px = (e.clientX - r.left)/r.width - .5, py = (e.clientY - r.top)/r.height - .5;
      if (!plano) gsap.to(pn, {rotateY:px*6, rotateX:-py*5, duration:.9, ease:'power3.out', overwrite:'auto'});
      /* solo scale/x/y: el yPercent del parallax con scrub vive aparte y no se toca */
      if (im) gsap.to(im, {scale: plano ? 1.03 : 1.045, x:-px*(plano?26:16), y:-py*(plano?18:12),
        duration:1, ease:'power3.out', overwrite:'auto'});
      if (tx) gsap.to(tx, {x:px*14, y:py*10, duration:1, ease:'power3.out', overwrite:'auto'});
    });
    pn.addEventListener('mouseleave', function(){
      if (!plano) gsap.to(pn, {rotateY:0, rotateX:0, duration:1.1, ease:'expo.out'});
      if (im) gsap.to(im, {scale:1, x:0, y:0, duration:1.2, ease:'expo.out'});
      if (tx) gsap.to(tx, {x:0, y:0, duration:1.2, ease:'expo.out'});
    });
  });
}


/* ============================================================
   PUERTA · el scroll es el mando de la camara
   ------------------------------------------------------------
   No se reproduce: se le mueve el `currentTime`. El avance dentro de la
   seccion pegada mapea al tiempo del video, asi que el visitante entra por la
   puerta al ritmo que quiera y puede pararse a mitad.

   El tween va sobre un objeto intermedio y no sobre el <video> a proposito: con
   `scrub` GSAP suaviza ese numero, y de ahi sale un movimiento continuo aunque
   la rueda llegue a saltos. Escribir `currentTime` directo desde el progreso del
   ScrollTrigger daria el valor crudo, con los tirones de la rueda dentro.

   El archivo se codifico con un fotograma clave cada cinco (`-g 5`): buscar un
   instante cuesta como mucho cuatro fotogramas de decodificacion. Con el ajuste
   normal —uno cada dos segundos— cada salto obliga a decodificar desde muy
   atras y el rebobinado va a tirones.
   ============================================================ */
(function(){
  var sec = document.getElementById('door'); if (!sec) return;
  var v = document.getElementById('doorv');
  var tx = sec.querySelector('.door-tx'), sc = sec.querySelector('.door-sc');

  /* Safari en iOS no decodifica un video que nunca se ha reproducido, y
     entonces `currentTime` no pinta nada. Un play/pause en el primer gesto lo
     desbloquea; en el resto de navegadores sobra y no molesta. */
  var listo = false;
  function despertar(){
    if (listo) return; listo = true;
    var pr = v.play();
    if (pr && pr.then) pr.then(function(){ v.pause(); }).catch(function(){});
  }
  ['touchstart','pointerdown','wheel','keydown'].forEach(function(ev){
    addEventListener(ev, despertar, {once:true, passive:true});
  });

  /* La camara termina su viaje en el primer tercio y ahi se queda: el ultimo
     fotograma es blanco, asi que el resto del recorrido tiene de fondo la misma
     hoja sobre la que van entrando los paneles de texto. */
  var p = {t:0};
  gsap.to(p, {t:1, ease:'none',
    scrollTrigger:{trigger:sec, start:'top top', end:'32% top', scrub:.45},
    onUpdate:function(){
      if (v.readyState < 1 || !isFinite(v.duration)) return;
      /* el ultimo fotograma es el blanco de la seccion de abajo: se deja justo
         antes del final para no caer en el hueco entre el ultimo cuadro y la
         duracion declarada */
      v.currentTime = Math.min(p.t * v.duration, v.duration - 0.05);
    }});

  /* El velo del canto se apaga en cuanto la camara arranca: para entonces el
     lienzo ya esta pegado arriba y no hay seccion encima con la que empatar,
     y dejarlo puesto pondria una banda navy sobre el blanco del final. */
  var arriba = sec.querySelector('.door-top');
  if (arriba) gsap.to(arriba, {opacity:0, ease:'none',
    scrollTrigger:{trigger:sec, start:'top top', end:'13% top', scrub:.4}});

  /* El texto se va antes de cruzar el umbral: sostenerlo mientras la camara
     entra lo dejaria flotando sobre el blanco, ilegible. */
  gsap.to([tx, sc], {opacity:0, ease:'none',
    scrollTrigger:{trigger:sec, start:'top top', end:'22% top', scrub:.4}});

  /* La capa que entra sobre la luz. Aparece cuando la camara ya cruzo el umbral
     —sobre el 52 % del recorrido— y sigue subiendo hasta el final: cuando el pin
     se suelta, el texto esta terminando su viaje y la seccion de abajo entra
     detras sin que nada se pare en seco.

     El paralaje es que cada pieza lleva su propia profundidad en `data-dp`: la
     etiqueta viaja poco, el titular mas y el parrafo el que mas. Recorridos
     distintos sobre el mismo scroll es lo unico que hace falta — no hay tres
     capas de fondo ni nada que simular. */
  /* Los paneles que se relevan sobre la luz. Cada uno declara su tramo en
     `data-band` — "entra,sale" en porcentaje del recorrido de la seccion; sin el
     segundo numero, se queda hasta el final y es el que entrega la pagina a la
     seccion de abajo. El JS no sabe cuantos paneles hay ni que dicen.

     Los tramos van EN SERIE, no encabalgados: la salida de uno termina donde
     empieza la entrada del siguiente. Todos ocupan el mismo sitio de la pantalla,
     asi que solaparlos deja dos textos translucidos uno encima de otro y no se
     lee ninguno. Cada panel sale a `sale + SAL`, y el siguiente entra ahi. */
  var capas = sec.querySelectorAll('.door-in');
  capas.forEach(function(capa){
    var b = (capa.dataset.band || '0').split(',').map(parseFloat);
    var entra = b[0], sale = b.length > 1 ? b[1] : null;

    var piezas = capa.querySelectorAll('[data-dp]');
    var ENT = 9, SAL = 8;                       // largo de entrada y salida, en %
    var tramo = (sale === null ? Math.max(100 - entra, ENT) : sale + SAL - entra);

    /* La opacidad del panel entero va en UNA linea de tiempo, no en dos tweens
       sueltos. Con entrada y salida por separado, al refrescar el ScrollTrigger
       la de salida renderiza su estado de partida —opacidad 1— aunque su tramo
       aun no haya empezado, y el panel aparece encima del anterior. Una sola
       linea de tiempo no puede contradecirse a si misma. */
    gsap.set(piezas, {opacity:0});
    var tl = gsap.timeline({scrollTrigger:{trigger:sec,
      start:entra+'% top', end:(entra+tramo)+'% top', scrub:.4}});
    tl.to(piezas, {opacity:1, ease:'none', duration:ENT});
    tl.to(piezas, {opacity:1, duration:Math.max(tramo - ENT - (sale === null ? 0 : SAL), .01)});
    if (sale !== null) tl.to(piezas, {opacity:0, ease:'none', duration:SAL});

    /* El viaje va aparte y por pieza: cada una recorre una distancia distinta
       sobre el mismo scroll, y de esa diferencia sale la profundidad. */
    piezas.forEach(function(el){
      var d = parseFloat(el.dataset.dp);
      gsap.set(el, {y:d});
      gsap.to(el, {y:-d*0.42, ease:'none', immediateRender:false,
        scrollTrigger:{trigger:sec, start:(entra-6)+'% top',
          end:(sale === null ? 'bottom bottom' : (sale+SAL)+'% top'), scrub:.5}});
    });
  });

  /* El vídeo de la sala confinada viaja DENTRO de su marco, aparte del viaje
     del panel: mide 112 % de alto y arranca en -6 %, así que el recorrido (±6 %)
     nunca descubre el borde. Y solo se reproduce en su tramo: es un time-lapse
     de diez segundos y no tiene por qué decodificar durante toda la página. */
  /* el blanco plano entra justo cuando el cuadro del vídeo ya es blanco */
  var blanco = sec.querySelector('.door-blanco');
  if (blanco) gsap.fromTo(blanco, {opacity:0}, {opacity:1, ease:'none',
    scrollTrigger:{trigger:sec, start:'27% top', end:'33% top', scrub:.4}});

  var conf = sec.querySelector('.door-md video');
  if (conf) {
    /* El montaje avanza con el dedo, no solo. Es el mismo mando que la puerta:
       el scroll escribe `currentTime` a través de un objeto intermedio para que
       el `scrub` suavice el número y el time-lapse no vaya a tirones. El clip
       se recodificó con `-g 5` por lo mismo. */
    var pg = sec.querySelector('.door-pg b');
    var q = {t:0};
    gsap.to(q, {t:1, ease:'none',
      scrollTrigger:{trigger:sec, start:'30% top', end:'92% top', scrub:.5},
      onUpdate:function(){
        if (pg) gsap.set(pg, {scaleX:q.t});
        if (conf.readyState < 1 || !isFinite(conf.duration)) return;
        conf.currentTime = Math.min(q.t * conf.duration, conf.duration - 0.05);
      }});
    /* y el marco viaja aparte: profundidad entre la imagen y el texto */
    gsap.fromTo(conf, {yPercent:-6, scale:1.08}, {yPercent:6, scale:1, ease:'none',
      scrollTrigger:{trigger:sec, start:'26% top', end:'95% top', scrub:.6}});
    /* Safari no decodifica un vídeo que nunca se reprodujo y `currentTime` no
       pinta nada: un play/pause en el primer gesto lo desbloquea. */
    var abrir = function(){ var pr = conf.play(); if (pr && pr.then) pr.then(function(){ conf.pause(); }).catch(function(){}); };
    ['touchstart','pointerdown','wheel','keydown'].forEach(function(ev){ addEventListener(ev, abrir, {once:true, passive:true}); });
    ScrollTrigger.create({trigger:sec, start:'20% top', end:'98% top',
      onEnter:abrir, onEnterBack:abrir});
  }

  /* Nada de esto tiene sentido si el visitante pidio menos movimiento: se deja
     el primer fotograma fijo, que es la sala cerrada. */
  if (RM){
    ScrollTrigger.getAll().forEach(function(t){ if (t.trigger === sec) t.kill(); });
    /* sin movimiento se deja solo el ultimo panel, que es el que cierra */
    if (capas.length) gsap.set(capas[capas.length-1].children, {opacity:1, y:0});
  }
})();

/* -- parallax por capas: cada figura viaja a su propia velocidad -- */
gsap.utils.toArray('[data-par]').forEach(function(el){
  var v = parseFloat(el.dataset.par);
  gsap.fromTo(el, {yPercent:-v}, {yPercent:v, ease:'none',
    scrollTrigger:{trigger: el.closest('.pnl') || el.parentElement,
      start:'top bottom', end:'bottom top', scrub:1.1, invalidateOnRefresh:true}});
});

/* -- cifras: profundidad por columna.
   Cada columna viaja a su propia velocidad (la primera casi quieta, la ultima
   la que mas) y dentro de cada celda la etiqueta va en sentido contrario al
   numero. La fila se abre en abanico con el scroll y se vuelve a cerrar, en vez
   de subir en bloque como una sola capa. -- */
gsap.utils.toArray('.figs').forEach(function(fig){
  gsap.utils.toArray(fig.querySelectorAll('.f')).forEach(function(f,i){
    var num = f.querySelector('.num'), lbl = f.querySelector('.lbl');
    var st = {trigger:fig, start:'top bottom', end:'bottom top', scrub:1.1, invalidateOnRefresh:true};
    var v = 10 + i*6, w = 4 + i*2;
    if (num) gsap.fromTo(num, {y:v},  {y:-v, ease:'none', scrollTrigger:st});
    if (lbl) gsap.fromTo(lbl, {y:-w}, {y:w,  ease:'none', scrollTrigger:st});
  });
});

/* -- la cita se enciende palabra por palabra con el scroll -- */
document.querySelectorAll('[data-scrub]').forEach(function(el){
  var ws = el.textContent.trim().split(/\s+/);
  el.innerHTML = ws.map(function(w){ return '<span class="wq">' + w + '</span>'; }).join(' ');
  gsap.to(el.querySelectorAll('.wq'), {opacity:1, ease:'none', stagger:.5,
    scrollTrigger:{trigger:el, start:'top 82%', end:'bottom 62%', scrub:.7}});
});

/* -- las cifras laterales entran escalonadas -- */
gsap.utils.toArray('.mini li').forEach(function(li,i){
  gsap.from(li,{y:26,opacity:0,duration:.9,delay:i*.09,
    scrollTrigger:{trigger:'.mini',start:'top 90%'}});
});

/* contadores */
document.querySelectorAll('[data-count]').forEach(el=>{
  const end=parseFloat(el.dataset.count), dec=+(el.dataset.dec||0), p=el.dataset.pre||'', s=el.dataset.suf||'';
  const o={v:0};
  gsap.to(o,{v:end,duration:2.2,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 90%'},
    onUpdate:()=>el.textContent = p + o.v.toFixed(dec).replace('.',',') + s});
});
gsap.utils.toArray('.figs').forEach(g=>{
  gsap.from(g.children,{y:52,opacity:0,duration:1.2,stagger:.08,
    scrollTrigger:{trigger:g, start:'top 84%'}});
});

/* ============================================================
   WEBGL · SALA DE DATOS
   ============================================================ */
(function(){
  if (typeof THREE === 'undefined') return;
  const cv = document.getElementById('cv');
  const sec = document.getElementById('hall');
  const rn = new THREE.WebGLRenderer({canvas:cv, antialias:true, alpha:false});
  rn.setPixelRatio(Math.min(devicePixelRatio,2));
  const sn = new THREE.Scene();
  sn.background = new THREE.Color(0x020D1F);
  sn.fog = new THREE.Fog(0x020D1F, 10, 46);

  const cam = new THREE.PerspectiveCamera(46, 1, .1, 120);
  cam.position.set(0, 1.75, 20);

  sn.add(new THREE.AmbientLight(0x8f9bb5, .55));
  const d1 = new THREE.DirectionalLight(0xE3E6EB, .95); d1.position.set(6,12,8); sn.add(d1);
  const d2 = new THREE.DirectionalLight(0x6f7c99, .5); d2.position.set(-8,6,-6); sn.add(d2);

  /* piso */
  const grid = new THREE.GridHelper(90, 90, 0x1F3256, 0x10203C);
  sn.add(grid);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(90,90),
    new THREE.MeshStandardMaterial({color:0x041430, roughness:.92, metalness:.05})
  );
  floor.rotation.x = -Math.PI/2; floor.position.y = -.01; sn.add(floor);

  /* racks */
  const ROWS = 4, PER = 16;
  const N = ROWS*PER;
  const rg = new THREE.BoxGeometry(.62, 2.05, 1.05);
  const rm = new THREE.MeshStandardMaterial({color:0x0F203D, roughness:.62, metalness:.35});
  const racks = new THREE.InstancedMesh(rg, rm, N);
  const led = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(.42,.032),
    new THREE.MeshBasicMaterial({color:0xE3E6EB, transparent:true, opacity:.85}),
    N*7
  );
  const dm = new THREE.Object3D();
  let k=0, l=0;
  for (let r=0;r<ROWS;r++){
    const z = -6 + r*4.2;
    for (let i=0;i<PER;i++){
      const x = -PER*.36 + i*.72;
      dm.position.set(x, 1.03, z); dm.rotation.set(0,0,0); dm.scale.set(1,1,1);
      dm.updateMatrix(); racks.setMatrixAt(k++, dm.matrix);
      for (let u=0;u<7;u++){
        dm.position.set(x, .35+u*.24, z + .53);
        dm.updateMatrix(); led.setMatrixAt(l, dm.matrix);
        led.setColorAt(l, new THREE.Color().setScalar(.35 + Math.random()*.65));
        l++;
      }
    }
  }
  racks.instanceMatrix.needsUpdate = true;
  led.instanceMatrix.needsUpdate = true;
  if (led.instanceColor) led.instanceColor.needsUpdate = true;
  sn.add(racks); sn.add(led);

  /* contención de pasillo (techos) */
  const cmat = new THREE.MeshStandardMaterial({color:0xE3E6EB, transparent:true, opacity:.055, side:THREE.DoubleSide});
  for (let r=0;r<ROWS-1;r++){
    const p = new THREE.Mesh(new THREE.PlaneGeometry(PER*.74, 3.1), cmat);
    p.rotation.x = -Math.PI/2; p.position.set(0, 2.25, -6 + r*4.2 + 2.1); sn.add(p);
  }
  /* bandejas de cable */
  const tmat = new THREE.MeshStandardMaterial({color:0x1B2F52, roughness:.8});
  for (let r=0;r<ROWS;r++){
    const t = new THREE.Mesh(new THREE.BoxGeometry(PER*.76, .07, .34), tmat);
    t.position.set(0, 3.05, -6 + r*4.2); sn.add(t);
  }

  function size(){
    const w = sec.clientWidth, h = sec.clientHeight;
    rn.setSize(w,h,false); cam.aspect = w/h; cam.updateProjectionMatrix();
  }
  size(); addEventListener('resize', size);

  const st = {p:0};
  ScrollTrigger.create({trigger:sec, start:'top bottom', end:'bottom top', scrub:1,
    onUpdate:s=>st.p = s.progress});

  let mx=0,my=0;
  if (!TOUCH) addEventListener('mousemove',e=>{ mx=(e.clientX/innerWidth-.5); my=(e.clientY/innerHeight-.5); });

  let vis = true;
  ScrollTrigger.create({trigger:sec, start:'top bottom', end:'bottom top',
    onToggle:s=>vis=s.isActive});

  const clk = new THREE.Clock();
  (function loop(){
    requestAnimationFrame(loop);
    if (!vis) return;
    const t = clk.getElapsedTime();
    const p = st.p;
    cam.position.z = 22 - p*30;
    cam.position.y = 1.7 + Math.sin(t*.4)*.09 - my*.6;
    cam.position.x = mx*2.2;
    cam.lookAt(0, 1.35 + p*.3, cam.position.z - 8);
    led.material.opacity = .55 + Math.sin(t*2.1)*.18;
    rn.render(sn, cam);
  })();

  /* lectura numérica sincronizada */
  const r1=document.getElementById('rd1'), r2=document.getElementById('rd2'), r3=document.getElementById('rd3');
  const o={a:0,b:0,c:0};
  gsap.to(o,{a:N,b:12,c:ROWS-1,duration:2.4,ease:'power2.out',scrollTrigger:{trigger:sec,start:'top 65%'},
    onUpdate:()=>{ r1.textContent=Math.round(o.a); r2.textContent=Math.round(o.b); r3.textContent=Math.round(o.c); }});
})();

/* ============================================================
   CARRUSEL 3D DE PANTALLAS
   ============================================================ */
(function(){
  const stage = document.getElementById('tvs');
  if (!stage) return;
  const tvs = [...stage.querySelectorAll('.tv')];
  const N = tvs.length;
  const prev = document.getElementById('sp'), next = document.getElementById('sn');
  const tk = document.getElementById('stk'), ctr = document.getElementById('sc1');
  const eL = document.getElementById('tvL'), eT = document.getElementById('tvT'), eD = document.getElementById('tvD');
  let act = 0, auto = null;

  const cw = () => tvs[0].getBoundingClientRect().width;

  /* coloca cada pantalla en el espacio 3D según su distancia al centro */
  function place(anim = true){
    const w = cw();
    tvs.forEach((tv, i) => {
      const o  = i - act;                        // desplazamiento respecto al activo
      const ab = Math.abs(o);
      const dir = Math.sign(o);
      const to = {
        x:        dir * (w * 0.50 + Math.min(ab,1) * w * 0.06) * Math.min(ab, 2.4),
        z:        -ab * 300,
        rotateY:  -dir * Math.min(ab, 2) * 34,
        scale:    Math.max(.6, 1 - ab * .1),
        opacity:  ab > 2.4 ? 0 : 1,
        zIndex:   100 - Math.round(ab * 10),
        duration: anim ? 1.15 : 0,
        ease:'expo.out'
      };
      gsap.to(tv, to);
      gsap.to(tv.querySelector('.dim'), {opacity: ab === 0 ? 0 : Math.min(.62, .3 + ab*.18), duration: anim ? .9 : 0});
      tv.classList.toggle('act', ab === 0);
    });
    gsap.to(tk, {left:(act * 100 / N) + '%', width:(100/N)+'%', duration:.8, ease:'expo.out'});
    ctr.textContent = String(act + 1).padStart(2,'0');
    swapText(tvs[act]);
  }

  /* el pie de texto entra con máscara, como el resto del sitio */
  function swapText(tv){
    const pairs = [[eL, tv.dataset.l], [eT, tv.dataset.t], [eD, tv.dataset.d]];
    pairs.forEach(([el, val], i) => {
      if (el.textContent === val) return;
      gsap.to(el, {y:-16, opacity:0, duration:.32, ease:'power2.in', delay:i*.045, onComplete:()=>{
        el.textContent = val;
        gsap.fromTo(el, {y:18, opacity:0}, {y:0, opacity:1, duration:.62, ease:'expo.out'});
      }});
    });
  }

  const go = i => { act = (i + N) % N; place(); };
  prev.onclick = () => { go(act - 1); stopAuto(); };
  next.onclick = () => { go(act + 1); stopAuto(); };
  tvs.forEach((tv,i) => tv.addEventListener('click', () => { if (i !== act && !moved) { go(i); stopAuto(); } }));

  /* arrastre */
  let down=false, sx=0, moved=false;
  stage.addEventListener('pointerdown', e=>{ down=true; moved=false; sx=e.clientX; stage.classList.add('dg'); stage.setPointerCapture(e.pointerId); stopAuto(); });
  stage.addEventListener('pointermove', e=>{
    if(!down) return;
    const d = e.clientX - sx;
    if (Math.abs(d) > 6) moved = true;
    gsap.to(stage, {rotateY: d * 0.02, duration:.4, overwrite:true});
  });
  const release = e => {
    if(!down) return; down=false; stage.classList.remove('dg');
    gsap.to(stage, {rotateY:0, duration:.9, ease:'expo.out'});
    const d = (e.clientX ?? sx) - sx;
    if (Math.abs(d) > 55) go(act + (d < 0 ? 1 : -1));
  };
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);

  /* teclado cuando la sección está a la vista */
  let inView = false;
  ScrollTrigger.create({trigger:'#design', start:'top 60%', end:'bottom 40%', onToggle:s=>inView=s.isActive});
  addEventListener('keydown', e=>{
    if(!inView) return;
    if(e.key==='ArrowRight'){ go(act+1); stopAuto(); }
    if(e.key==='ArrowLeft'){ go(act-1); stopAuto(); }
  });

  /* inclinación 3D de la pantalla activa siguiendo el puntero */
  if (!TOUCH){
    const wrap = stage.parentElement;
    wrap.addEventListener('mousemove', e=>{
      const r = stage.getBoundingClientRect();
      const px = (e.clientX - r.left)/r.width - .5, py = (e.clientY - r.top)/r.height - .5;
      const a = tvs[act];
      gsap.to(a, {rotateY: px*11, rotateX: -py*8, duration:.8, ease:'power3.out', overwrite:'auto'});
      gsap.to(a.querySelector('.scr img'), {x:-px*22, y:-py*14, duration:1, ease:'power3.out'});
      gsap.to(a.querySelector('.glr'), {x:px*44, duration:1, ease:'power3.out'});
    });
    wrap.addEventListener('mouseleave', ()=>{
      const a = tvs[act];
      gsap.to(a,{rotateY:0, rotateX:0, duration:1, ease:'expo.out'});
      gsap.to([a.querySelector('.scr img'), a.querySelector('.glr')],{x:0,y:0,duration:1.1,ease:'expo.out'});
    });
    /* etiqueta "arrastrar" sobre el escenario */
    const dl = document.getElementById('dl');
    const dX = gsap.quickTo(dl,'x',{duration:.45,ease:'power3'}), dY = gsap.quickTo(dl,'y',{duration:.45,ease:'power3'});
    stage.addEventListener('mouseenter', ()=>{ gsap.to(dl,{opacity:1,scale:1,duration:.4}); document.body.classList.add('hidec'); });
    stage.addEventListener('mouseleave', ()=>{ gsap.to(dl,{opacity:0,scale:.5,duration:.3}); document.body.classList.remove('hidec'); });
    stage.addEventListener('mousemove', e=>{ dX(e.clientX); dY(e.clientY); });
  }

  /* avance automático, se detiene con la primera interacción */
  function startAuto(){ stopAuto(); auto = setInterval(()=>go(act+1), 5200); }
  function stopAuto(){ if(auto){ clearInterval(auto); auto=null; } }
  ScrollTrigger.create({trigger:'#design', start:'top 65%', once:true, onEnter:()=>{
    gsap.from(tvs, {y:70, opacity:0, duration:1.2, stagger:.09, ease:'expo.out', onComplete:startAuto});
  }});

  /* el escenario rota levemente con el scroll */
  gsap.fromTo(stage, {rotateX:7}, {rotateX:-4, ease:'none',
    scrollTrigger:{trigger:'#design', start:'top bottom', end:'bottom top', scrub:1.2}});

  addEventListener('resize', ()=>place(false));
  place(false);
})();

/* ============================================================
   SERVICIOS HORIZONTAL
   ============================================================ */
(function(){
  if (innerWidth<=860) return;
  const tr=document.getElementById('hztr'), pin=document.getElementById('hz'), bar=document.getElementById('hzb');
  const pad=()=>parseFloat(getComputedStyle(document.body).getPropertyValue('--pad'))||40;
  const dist=()=>Math.max(0, tr.scrollWidth - innerWidth + pad()*2);
  const mueve = gsap.timeline({scrollTrigger:{trigger:'#svc', start:'top top', end:()=>'+='+dist(),
    pin:pin, scrub:1, invalidateOnRefresh:true, anticipatePin:1,
    /* este pin mete ~2800 px de espaciador. Sin prioridad, todo ScrollTrigger
       que este mas abajo calcula su posicion sin contar ese alto y queda
       corrido: las animaciones disparan antes de tiempo y el video de bancos
       de carga nunca se activaba. Refrescando este primero, los de abajo ya
       miden con el espaciador puesto. */
    refreshPriority:1}})
    .to(tr,{x:()=>-dist(), ease:'none'},0)
    .fromTo(bar,{scaleX:0},{scaleX:1,ease:'none'},0);
  gsap.from('.sv',{y:80,opacity:0,duration:1.1,stagger:.05,scrollTrigger:{trigger:'#svc',start:'top 72%'}});

  /* Parallax dentro de la pista. Estas tarjetas no se mueven con el scroll de la
     página sino dentro de `mueve`, así que cada disparador necesita
     `containerAnimation`: sin él mediría contra el eje vertical y no casaría
     nunca.
     - la foto viaja contra la pista (xPercent +9 → -9) y se abre dentro de su
       marco al pasar, en vez de ir pegada a él;
     - al entrar por la derecha la foto llega ampliada y se asienta;
     - el texto entra con un pequeño retraso respecto a la foto: dos capas a
       distinta velocidad.
     Propiedades separadas del tilt: aquí xPercent y scale sobre la imagen solo
     en el tramo de entrada; el tilt usa x/y/scale en hover. Para no pelear por
     `scale`, la escala de entrada va en el marco, no en la imagen. */
  /* Los dos paneles de entrada entran como las fichas: con containerAnimation,
     porque se mueven dentro de la pista y no con el scroll de la página. */
  gsap.utils.toArray('.sv-int, .sv-tit').forEach(function(pn){
    gsap.fromTo(pn.children, {x:70, opacity:0}, {x:0, opacity:1, stagger:.05, ease:'none',
      scrollTrigger:{trigger:pn, containerAnimation:mueve, start:'left 104%', end:'left 62%', scrub:true}});
  });

  gsap.utils.toArray('.sv').forEach(function(sv){
    var marco = sv.querySelector('.sv-im'), im = marco && marco.querySelector('img');
    if (!im) return;
    gsap.fromTo(im, {xPercent:9}, {xPercent:-9, ease:'none',
      scrollTrigger:{trigger:sv, containerAnimation:mueve, start:'left right', end:'right left', scrub:true}});
    gsap.fromTo(marco, {clipPath:'inset(0 0 0 100%)'}, {clipPath:'inset(0 0 0 0%)', ease:'none',
      scrollTrigger:{trigger:sv, containerAnimation:mueve, start:'left 104%', end:'left 86%', scrub:true}});
    var capas = sv.querySelectorAll('h3, p, ul, .tg');
    gsap.fromTo(capas, {x:60, opacity:0}, {x:0, opacity:1, stagger:.04, ease:'none',
      scrollTrigger:{trigger:sv, containerAnimation:mueve, start:'left 108%', end:'left 80%', scrub:true}});
  });
})();

/* ============================================================
   CONFIGURADOR
   ============================================================ */
(function(){
  const R=document.getElementById('iR'), K=document.getElementById('iK');
  const vR=document.getElementById('vR'), vK=document.getElementById('vK'), vT=document.getElementById('vT'), vC=document.getElementById('vC');
  const ROM=['I','II','III','IV'];
  const TOP=['N','N','N+1','2N'];          // topología por TIER
  const RED=[1.0,1.1,1.25,1.5];            // sobredimensión eléctrica
  const CN =['Perimetral','Contención','In-row'];
  const PUE=[1.72,1.54,1.38];              // PUE por estrategia
  let tier=2, cool=1;

  /* ---------- constantes de la planta 2D ----------
     Todo en metros. Rack de 600 x 1200 mm, que es la huella estandar de un
     gabinete de 42U. Los anchos de pasillo y la franja contra el muro cambian
     con la estrategia: sin confinar hay que dar mas holgura para que el aire
     mezcle, in-row casi no necesita perimetro porque el frio nace en la fila. */
  const RW=.6, RD=1.2;                     // ancho y fondo del rack
  const COLDA=[1.5,1.2,1.2];               // pasillo frio por estrategia
  const HOTA =[1.4,.9,.9];                 // pasillo caliente
  const BANDV=[2.6,2.2,1.5];               // franja contra el muro (va el clima)
  const MRGH =[1.5,1.4,1.2];               // holgura lateral
  const UW=2.2, UD=.9;                     // unidad perimetral CRAH
  const IW=.35;                            // unidad in-row (350 mm)
  const CAPU=105, CAPI=40;                 // kW de refrigeracion por unidad
  const TSUP=18, DT=12;                    // impulsion y salto de diseno en el rack
  /* fraccion de aire frio que vuelve al clima sin haber pasado por un rack. Es
     la variable que gobierna todo lo demas: lo que se escapa por arriba del
     pasillo hay que reponerlo en la entrada del gabinete con aire ya caliente. */
  const BYP=[.34,.12,.05];
  const MAXR=300;                          // techo de racks dibujados
  const VB={w:1000};
  const COLD='#5E9BE0', HOT='#E4622A';
  const pln=document.getElementById('pln');

  const out={IT:0,Tot:0,UPS:0,TR:0,A:0,P:0};
  const el=id=>document.getElementById(id);
  const fmt=(n,d=0)=>n.toLocaleString('es-CO',{minimumFractionDigits:d,maximumFractionDigits:d});

  /* ============================================================
     GEOMETRIA DE LA SALA
     Devuelve la planta en metros mas la termica que la colorea. Nadie dibuja
     aqui: esto es solo el modelo, y draw() lo pinta.
     ============================================================ */
  function geom(racks,kw,tier,cool){
    const N=Math.min(racks,MAXR);            // los que caben en el dibujo
    const it=racks*kw;
    const cold=COLDA[cool], hot=HOTA[cool], bv=BANDV[cool], mh=MRGH[cool];

    /* unidades de clima. In-row: una cada CAPI kW, dentro de la propia fila, mas
       dos perimetrales de respaldo. Perimetral y contencion: CRAH contra los
       muros, dimensionadas con la misma sobredimension electrica del TIER. */
    const nir = cool===2 ? Math.max(2, Math.ceil(it/CAPI)) : 0;
    const nper= cool===2 ? 2 : Math.max(2, Math.ceil(it*RED[tier]/CAPU));

    /* Cuantos pares de filas. Cada par son dos filas enfrentadas por el frente
       con su pasillo frio en medio; entre pares va el caliente. Pruebo de 1 a 8
       y me quedo con la sala mas cercana a 1,55:1, que es la proporcion a la que
       una nave se lee bien y se cablea bien. */
    const pick=b=>{
      let L=null;
      for(let P=1;P<=8;P++){
        const rows=2*P, n=Math.ceil(N/rows);
        if(n<2||n>46) continue;             // filas de mas de 27 m no se operan
        const ir=Math.ceil(nir/rows);
        const W=2*mh+n*RW+ir*IW;
        const D=2*b+P*(2*RD+cold)+(P-1)*hot;
        const sc=Math.abs((W/D)-1.55);
        if(!L||sc<L.sc) L={P,rows,n,ir,W,D,sc};
      }
      if(!L){ const rows=2, n=Math.ceil(N/2), ir=Math.ceil(nir/rows);
        L={P:1,rows,n,ir,W:2*mh+n*RW+ir*IW,D:2*b+2*RD+cold,sc:0}; }
      return L;
    };

    /* Si las unidades no caben en una hilera contra el muro se abre la franja
       para meter dos, que es lo que se hace de verdad: una galeria de clima
       pegada a la pared. Si ni con dos caben, la sala pide otra estrategia y el
       aviso del pie lo dice. */
    let rank=1, bvv=bv, L=pick(bv);
    let capW=Math.max(1,Math.floor((L.W-2*mh)/(UW+.5)));
    if(nper>capW*2){
      rank=2; bvv=bv+UD+.7; L=pick(bvv);
      capW=Math.max(1,Math.floor((L.W-2*mh)/(UW+.5)));
    }

    /* --- bandas horizontales: fila, pasillo frio, fila, pasillo caliente --- */
    const rowY=[], coldY=[], hotY=[];
    let y=bvv;
    for(let p=0;p<L.P;p++){
      rowY.push(y);  y+=RD;
      coldY.push(y); y+=cold;
      rowY.push(y);  y+=RD;
      if(p<L.P-1){ hotY.push(y); y+=hot; }
    }

    /* --- reparto de racks y de unidades in-row entre las filas --- */
    const split=(tot,m)=>{const b=Math.floor(tot/m), r=tot%m;
      return Array.from({length:m},(_,i)=>b+(i<r?1:0));};
    const perRow=split(N,L.rows), irRow=split(nir,L.rows);

    /* --- contenido de cada fila, con las unidades in-row intercaladas --- */
    const rows=[];
    for(let i=0;i<L.rows;i++){
      const items=[];
      for(let j=0;j<perRow[i];j++) items.push({t:'r'});
      /* las in-row se reparten sobre la fila de racks original y se insertan de
         derecha a izquierda: si se calculara sobre el array que va creciendo,
         las ultimas se amontonarian todas contra el extremo */
      const ni=irRow[i], nr=perRow[i];
      for(let j=ni-1;j>=0;j--) items.splice(Math.round(nr*(j+.5)/ni),0,{t:'u'});
      const wRow=items.reduce((a,o)=>a+(o.t==='r'?RW:IW),0);
      let x=(L.W-wRow)/2;
      items.forEach(o=>{ o.x=x; o.w=(o.t==='r'?RW:IW); x+=o.w; });
      /* el frente mira siempre al pasillo frio: las filas pares hacia abajo,
         las impares hacia arriba. De ahi salen los pares enfrentados. */
      rows.push({y:rowY[i], face:(i%2===0)?'down':'up', items});
    }

    /* --- unidades perimetrales, repartidas entre el muro de arriba y el de
       abajo, con su lado largo paralelo a los pasillos --- */
    const alto=rank*UD+(rank-1)*.7, off=(bvv-alto)/2;
    const wall=(c,yBand)=>{
      const q=Math.min(c,capW*rank), a=[];
      for(let k=0;k<rank && a.length<q;k++){
        const enFila=Math.min(capW,q-a.length);
        const st=(L.W-2*mh)/enFila;
        const uw=Math.min(UW,st*.86);        // en salas estrechas la unidad se ajusta al hueco
        const yy=yBand+off+k*(UD+.7);
        for(let i=0;i<enFila;i++) a.push({x:mh+st*(i+.5)-uw/2, y:yy, w:uw, h:UD});
      }
      return a;};
    const nTop=Math.ceil(nper/2), nBot=nper-nTop;
    const units=[...wall(nTop,0), ...wall(nBot,L.D-bvv)];
    const cabe = nper<=capW*2*rank;          // ¿caben en el perimetro?

    /* --- termica ---------------------------------------------------------
       El bypass no depende solo de la estrategia: cuanto mas densa la sala, mas
       violenta la recirculacion, porque el rack pide mas caudal del que el
       pasillo le entrega. k escala ese efecto con los kW por gabinete. */
    const k=Math.min(3.2,Math.max(.75,1+(kw-8)/22));
    const byp=BYP[cool];
    const Tin=TSUP+byp*DT*k;                 // temperatura de entrada al rack
    const spread=6*byp*k;                    // gradiente entre el rack mas frio y el mas caliente

    /* cada rack se calienta segun lo lejos que este de una unidad. Confinar
       aplasta ese gradiente: el frio llega igual al primero que al ultimo. */
    const src=[...units.map(u=>({x:u.x+u.w/2,y:u.y+u.h/2}))];
    rows.forEach(r=>r.items.forEach(o=>{ if(o.t==='u') src.push({x:o.x+o.w/2,y:r.y+RD/2}); }));
    let dmax=0;
    rows.forEach(r=>r.items.forEach(o=>{
      if(o.t!=='r') return;
      const cx=o.x+o.w/2, cy=r.y+RD/2;
      o.d=Math.min(...src.map(u=>Math.hypot(cx-u.x,cy-u.y)));
      if(o.d>dmax) dmax=o.d;
    }));
    rows.forEach(r=>r.items.forEach(o=>{
      if(o.t==='r') o.T=Tin+(dmax?o.d/dmax:0)*spread;
    }));
    const Tmax=Tin+spread;

    return {W:L.W,D:L.D,P:L.P,rows,coldY,hotY,cold,hot,bv:bvv,mh,units,
            nir,nper,cabe,Tin,Tmax,byp,kw,cool,it,
            truncado:racks>MAXR};
  }

  /* ============================================================
     DIBUJO
     Trabajo en metros y los paso a pixeles con X()/Y()/S(). Sin transform de
     grupo a proposito: asi ni los trazos ni las etiquetas se escalan con la
     sala, y el plano se lee igual con 8 racks que con 300.
     ============================================================ */
  const rgba=(h,a)=>{const n=parseInt(h.slice(1),16);
    return 'rgba('+(n>>16)+','+(n>>8&255)+','+(n&255)+','+a+')';};
  const mixc=(a,b,t)=>{const A=parseInt(a.slice(1),16), B=parseInt(b.slice(1),16);
    const c=(s)=>Math.round(((A>>s&255))+(((B>>s&255))-((A>>s&255)))*t);
    return 'rgb('+c(16)+','+c(8)+','+c(0)+')';};
  /* de 19 a 29 grados: por debajo se lee frio, por encima es punto caliente */
  const heat=T=>mixc(COLD,HOT,Math.min(1,Math.max(0,(T-19)/10)));
  /* la misma rampa precalculada en 64 pasos: la mancha la consulta una vez por
     pixel y parsear cadenas ahi dentro se notaba */
  const LUT=(()=>{
    const A=parseInt(COLD.slice(1),16), B=parseInt(HOT.slice(1),16), a=[];
    for(let i=0;i<64;i++){ const t=i/63, c=[];
      for(const sh of [16,8,0]){ const u=A>>sh&255, v=B>>sh&255; c.push(Math.round(u+(v-u)*t)); }
      a.push(c); }
    return a;
  })();
  const heatL=T=>LUT[Math.min(63,Math.max(0,Math.round((T-19)/10*63)))];

  /* ============================================================
     CAMPO DE VELOCIDADES
     Flujo potencial en 2D: cada impulsion es una fuente y cada aspiracion un
     sumidero, y la velocidad en un punto es la suma de todas. La cara frontal
     del rack aspira, la trasera expulsa; el clima impulsa hacia la sala y
     retorna contra el muro. El circuito se cierra solo.

     Se resuelve una vez sobre una malla y las lineas se integran interpolando
     en ella. Evaluar las singularidades en cada paso de cada linea costaria
     veinte veces mas y no se notaria la diferencia.
     ============================================================ */
  function campo(g){
    /* presupuesto fijo de celdas: en salas altas la malla crecia sin control y
       el coste es celdas x singularidades */
    const CEL=6200, asp=g.W/g.D;
    const NX=Math.max(30,Math.min(120,Math.round(Math.sqrt(CEL*asp))));
    const NY=Math.max(24,Math.round(CEL/NX));
    const hx=g.W/NX, hy=g.D/NY, n=NX*NY;
    const vx=new Float32Array(n), vy=new Float32Array(n), sol=new Float32Array(n);

    /* --- singularidades --- */
    const sg=[];
    /* Una fuente cada 1,2 m de fila: mas separadas y el campo entre dos vecinas
       zigzaguea, y las lineas del pasillo caliente salen a tirones. Pero el
       coste de la malla es celdas x singularidades, asi que el total se acota:
       en una sala de diez filas se reparte el presupuesto entre todas. */
    const TOPE=Math.max(6,Math.round(300/(2*Math.max(1,g.rows.length))));
    const SEG=Math.max(4,Math.min(26,TOPE,Math.round(g.W/1.2)));
    let car=0;                                  // cuantas caras aspirando
    g.rows.forEach(r=>{
      const rk=r.items.filter(q=>q.t==='r'); if(!rk.length) return;
      const xa=rk[0].x, xb=rk[rk.length-1].x+rk[rk.length-1].w;
      const ab=r.face==='down';
      const fre=ab?r.y+RD:r.y, esp=ab?r.y:r.y+RD, d=ab?.18:-.18;
      for(let i=0;i<SEG;i++){
        const xx=xa+(xb-xa)*(i+.5)/SEG;
        sg.push({x:xx, y:fre+d, m:-1});         // aspira frio por el frente
        sg.push({x:xx, y:esp-d, m:+1});         // expulsa caliente por la espalda
        car++;
      }
    });
    if(!car) return {trace:()=>[], };

    /* el reparto de la impulsion entre in-row y perimetro: con in-row el frio
       nace en la fila y el clima de los muros queda de respaldo */
    const ir=[]; g.rows.forEach(r=>r.items.forEach(q=>{
      if(q.t==='u') ir.push({x:q.x+q.w/2, r}); }));
    const cuota = ir.length ? .85 : 0;
    /* Con clima perimetral el frio no cruza la sala por el aire: baja al plenum
       y reaparece en el pasillo. Modelarlo como si viajara entre los racks daria
       lineas que los atraviesan. Asi que dos tercios de la impulsion se inyectan
       en las bocas de los pasillos frios — que es por donde sale de verdad — y
       el tercio restante en la cara de las unidades, para que se vea de donde
       viene. De ahi salen las corrientes largas que recorren el pasillo. */
    const bocas=[];
    g.coldY.forEach(y=>{
      const yc=y+g.cold/2;
      bocas.push({x:g.mh*.45, y:yc}, {x:g.W-g.mh*.45, y:yc});
    });
    const rBoca = ir.length ? 0 : .66;
    const mP = g.units.length ? car*(1-cuota)*(1-rBoca)/g.units.length : 0;
    const mB = bocas.length ? car*(1-cuota)*rBoca/bocas.length : 0;
    const mI = ir.length ? car*cuota/ir.length : 0;
    bocas.forEach(b=>{ if(mB) sg.push({x:b.x, y:b.y, m:+mB}); });

    g.units.forEach(u=>{
      const arr=u.y<g.D/2;
      sg.push({x:u.x+u.w/2, y:arr?u.y+u.h+.25:u.y-.25, m:+mP});   // impulsa a la sala
      sg.push({x:u.x+u.w/2, y:arr?u.y-.25:u.y+u.h+.25, m:-mP});   // retorna contra el muro
    });
    ir.forEach(o=>{
      const ab=o.r.face==='down';
      const fre=ab?o.r.y+RD:o.r.y, esp=ab?o.r.y:o.r.y+RD, d=ab?.2:-.2;
      sg.push({x:o.x, y:fre+d, m:+mI});
      sg.push({x:o.x, y:esp-d, m:-mI});
    });

    /* --- la malla --- */
    const eps2=.36*.36;                         // suavizado: sin el, la velocidad
    for(let j=0;j<NY;j++){                      // explota justo sobre la singularidad
      const y=(j+.5)*hy;
      for(let i=0;i<NX;i++){
        const x=(i+.5)*hx, k=j*NX+i;
        let ax=0, ay=0;
        for(let s=0;s<sg.length;s++){
          const p=sg[s], dx=x-p.x, dy=y-p.y;
          const w=p.m/(dx*dx+dy*dy+eps2);
          ax+=dx*w; ay+=dy*w;
        }
        vx[k]=ax; vy[k]=ay;
      }
    }

    /* --- conveccion del pasillo -------------------------------------------
       El flujo potencial no tiene inercia: el aire sembrado en la boca del
       pasillo se mete en el primer rack que pilla, y salian corrientes de dos
       metros. En un pasillo de verdad el chorro lleva cantidad de movimiento y
       lo recorre entero, entregando caudal segun avanza. Se modela sumando una
       velocidad longitudinal que entra por los dos extremos y se apaga hacia el
       centro, que es justo donde ya no queda aire por entregar. El caliente hace
       lo contrario: nace a lo largo y sale por los extremos. */
    let acc=0, cnt=0;
    for(let k=0;k<n;k++){ acc+=Math.hypot(vx[k],vy[k]); cnt++; }
    const U=(acc/cnt)*1.05;
    const banda=(y0,h,signo)=>{
      const j0=Math.max(0,Math.floor(y0/hy)), j1=Math.min(NY-1,Math.floor((y0+h)/hy));
      for(let j=j0;j<=j1;j++) for(let i=0;i<NX;i++){
        const x=(i+.5)*hx, mitad=g.W/2;
        const f=Math.abs(x-mitad)/mitad;        // 1 en los extremos, 0 en el centro
        vx[j*NX+i]+=signo*(x<mitad?1:-1)*U*f;
      }
    };
    g.coldY.forEach(y=>banda(y,g.cold,+1));     // frio: entra por los extremos
    g.hotY.forEach(y=>banda(y,g.hot,-1));       // caliente: sale por ellos

    /* una pasada de suavizado: quita el rizo que dejan las singularidades
       discretas sin mover el patron general del flujo */
    {
      const ax=new Float32Array(n), ay=new Float32Array(n);
      for(let j=0;j<NY;j++) for(let i=0;i<NX;i++){
        let sx=0,sy=0,c=0;
        for(let dj=-1;dj<=1;dj++) for(let di=-1;di<=1;di++){
          const jj=j+dj, ii=i+di;
          if(jj<0||ii<0||jj>=NY||ii>=NX) continue;
          sx+=vx[jj*NX+ii]; sy+=vy[jj*NX+ii]; c++;
        }
        ax[j*NX+i]=sx/c; ay[j*NX+i]=sy/c;
      }
      vx.set(ax); vy.set(ay);
    }

    /* --- solidos: racks y unidades --- */
    const marca=(x0,y0,w,hh)=>{
      const i0=Math.max(0,Math.floor(x0/hx)), i1=Math.min(NX-1,Math.floor((x0+w)/hx));
      const j0=Math.max(0,Math.floor(y0/hy)), j1=Math.min(NY-1,Math.floor((y0+hh)/hy));
      for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++) sol[j*NX+i]=1;
    };
    g.rows.forEach(r=>r.items.forEach(q=>marca(q.x,r.y,q.w,RD)));
    g.units.forEach(u=>marca(u.x,u.y,u.w,u.h));

    /* Se difumina el mapa de solidos para sacar de el la normal a la pared, y se
       le quita a la velocidad la componente que apunta hacia dentro del solido.
       Eso es lo que hace que el aire resbale por la cara del rack en vez de
       atravesarlo, que es la diferencia entre parecer aire y parecer cables. */
    let sm=Float32Array.from(sol);
    for(let p=0;p<2;p++){
      const t=new Float32Array(n);
      for(let j=0;j<NY;j++) for(let i=0;i<NX;i++){
        let a=0,c=0;
        for(let dj=-1;dj<=1;dj++) for(let di=-1;di<=1;di++){
          const jj=j+dj, ii=i+di;
          if(jj<0||ii<0||jj>=NY||ii>=NX) continue;
          a+=sm[jj*NX+ii]; c++;
        }
        t[j*NX+i]=a/c;
      }
      sm=t;
    }
    for(let j=1;j<NY-1;j++) for(let i=1;i<NX-1;i++){
      const k=j*NX+i;
      if(sol[k]){ vx[k]=0; vy[k]=0; continue; }
      let nx=-(sm[k+1]-sm[k-1]), ny=-(sm[k+NX]-sm[k-NX]);
      const m=Math.hypot(nx,ny);
      if(m<1e-6) continue;
      nx/=m; ny/=m;
      const d=vx[k]*nx+vy[k]*ny;
      if(d<0){ vx[k]-=d*nx; vy[k]-=d*ny; }
      /* y un empuje suave hacia afuera, proporcional a lo cerca que se este.
         Sin el, la linea se pega a la cara del rack y el primer error de
         redondeo la mete dentro: se cortaban todas a los tres pasos. */
      const mg=Math.hypot(vx[k],vy[k]);
      vx[k]+=nx*mg*.16*sm[k]; vy[k]+=ny*mg*.16*sm[k];
    }

    /* --- seguimiento de una particula (RK2, paso de arco constante) --- */
    const st=Math.min(hx,hy)*.85;
    /* magnitud tipica del campo, para saber cuando una linea se ha parado */
    let ref=0, nf=0;
    for(let k=0;k<n;k++) if(!sol[k]){ ref+=Math.hypot(vx[k],vy[k]); nf++; }
    ref=(ref/(nf||1))*.07;
    const v=[0,0], v2=[0,0];
    const mues=(x,y,out)=>{
      let fi=x/hx-.5, fj=y/hy-.5;
      let i=Math.floor(fi), j=Math.floor(fj);
      const tx=fi-i, ty=fj-j;
      i=Math.max(0,Math.min(NX-2,i)); j=Math.max(0,Math.min(NY-2,j));
      const k=j*NX+i;
      const a=(1-tx)*(1-ty), b=tx*(1-ty), c=(1-tx)*ty, e=tx*ty;
      out[0]=vx[k]*a+vx[k+1]*b+vx[k+NX]*c+vx[k+NX+1]*e;
      out[1]=vy[k]*a+vy[k+1]*b+vy[k+NX]*c+vy[k+NX+1]*e;
    };
    const dentro=(x,y)=>{
      const i=Math.floor(x/hx), j=Math.floor(y/hy);
      return (i<0||j<0||i>=NX||j>=NY) ? 1 : sol[j*NX+i];
    };
    /* dir = +1 aguas abajo, -1 aguas arriba. `stop` corta la linea cuando se
       acerca demasiado a otra ya dibujada: es lo que reparte la densidad. */
    const trace=(x0,y0,max,dir,stop)=>{
      const p=[x0,y0]; let px=x0, py=y0, ax=x0, ay=y0;
      for(let s=0;s<max;s++){
        mues(px,py,v);
        let m=Math.hypot(v[0],v[1]);
        if(!(m>ref)) break;                    // el aire se ha agotado aqui
        /* y si en doce pasos no ha avanzado, es un punto de estancamiento: la
           particula se queda oscilando y dibuja un garabato sobre si misma */
        if(s%12===0){
          if(s && Math.hypot(px-ax,py-ay)<st*3.5) break;
          ax=px; ay=py;
        }
        mues(px+v[0]/m*st*.5*dir, py+v[1]/m*st*.5*dir, v2);
        let m2=Math.hypot(v2[0],v2[1]);
        if(!(m2>1e-7)){ v2[0]=v[0]; v2[1]=v[1]; m2=m; }
        px+=v2[0]/m2*st*dir; py+=v2[1]/m2*st*dir;
        if(px<.04||py<.04||px>g.W-.04||py>g.D-.04) break;
        if(dentro(px,py)) break;               // ha entrado en un rack: ahi muere
        if(stop && s>2 && stop(px,py)) break;
        p.push(px,py);
      }
      return p;
    };

    /* --- campo de temperatura -------------------------------------------
       No sale de un calculo termico: se siembra por zonas —el pasillo frio a la
       impulsion, el caliente y el retorno al valor de vuelta, el rack a medias—
       y se difumina. Sirve para colorear la linea con la temperatura del aire
       que lleva encima, que es lo que da el degradado de azul a naranja. */
    const Tr=g.Tin+DT, Tm=(TSUP+Tr)/2;
    let T=new Float32Array(n).fill(Tm);
    const pinta=(y0,h,val)=>{
      const j0=Math.max(0,Math.floor(y0/hy)), j1=Math.min(NY-1,Math.floor((y0+h)/hy));
      for(let j=j0;j<=j1;j++) for(let i=0;i<NX;i++) T[j*NX+i]=val;
    };
    const y0f=g.rows[0].y, yNf=g.rows[g.rows.length-1].y+RD;
    pinta(0,y0f,Tr); pinta(yNf,g.D-yNf,Tr);          // retorno contra los muros
    g.hotY.forEach(y=>pinta(y,g.hot,Tr));
    g.coldY.forEach(y=>pinta(y,g.cold,TSUP));
    for(let q=0;q<3;q++){
      const t2=new Float32Array(n);
      for(let j=0;j<NY;j++) for(let i=0;i<NX;i++){
        let a=0,c=0;
        for(let dj=-1;dj<=1;dj++) for(let di=-1;di<=1;di++){
          const jj=j+dj, ii=i+di;
          if(jj<0||ii<0||jj>=NY||ii>=NX) continue;
          a+=T[jj*NX+ii]; c++;
        }
        t2[j*NX+i]=a/c;
      }
      T=t2;
    }
    const temp=(x,y)=>{
      const i=Math.min(NX-1,Math.max(0,Math.floor(x/hx)));
      const j=Math.min(NY-1,Math.max(0,Math.floor(y/hy)));
      return T[j*NX+i];
    };
    return {trace, temp, solido:dentro, W:g.W, D:g.D,
            malla:{NX,NY,T,vx,vy,sol,ref}};
  }

  /* ============================================================
     LINEAS EQUIESPACIADAS
     Sembrar todas las lineas en la boca del pasillo las amontonaba alli y dejaba
     el resto de la sala vacia. Esto es lo que se hace en un mapa de corrientes
     de verdad: se recorre la sala con una reticula, cada candidato que no este
     ya cubierto arranca una linea, se integra hacia delante y hacia atras, y la
     linea se corta en cuanto se acerca demasiado a otra ya dibujada. El
     resultado tiene densidad pareja en toda la planta.
     ============================================================ */
  function lineas(F,g,max){
    const dsep=Math.min(g.W,g.D)/31, dtest=dsep*.48;
    const GX=Math.ceil(g.W/dsep)+1, GY=Math.ceil(g.D/dsep)+1;
    const cel=[]; for(let i=0;i<GX*GY;i++) cel.push([]);
    const cerca=(x,y,r)=>{
      const i=Math.floor(x/dsep), j=Math.floor(y/dsep), r2=r*r;
      for(let jj=j-1;jj<=j+1;jj++){
        if(jj<0||jj>=GY) continue;
        for(let ii=i-1;ii<=i+1;ii++){
          if(ii<0||ii>=GX) continue;
          const a=cel[jj*GX+ii];
          for(let k=0;k<a.length;k+=2){
            const dx=a[k]-x, dy=a[k+1]-y;
            if(dx*dx+dy*dy<r2) return true;
          }
        }
      }
      return false;
    };
    const meter=(x,y)=>{
      const i=Math.min(GX-1,Math.max(0,Math.floor(x/dsep)));
      const j=Math.min(GY-1,Math.max(0,Math.floor(y/dsep)));
      cel[j*GX+i].push(x,y);
    };
    const test=(x,y)=>cerca(x,y,dtest);

    const out=[], pa=dsep*.72;
    for(let y=pa*.5;y<g.D && out.length<max;y+=pa){
      for(let x=pa*.5;x<g.W && out.length<max;x+=pa){
        if(F.solido(x,y)) continue;
        if(cerca(x,y,dsep*.92)) continue;
        const a=F.trace(x,y,190,+1,test);        // aguas abajo
        const b=F.trace(x,y,190,-1,test);        // y aguas arriba
        const p=[];
        for(let k=b.length-2;k>=2;k-=2) p.push(b[k],b[k+1]);
        for(let k=0;k<a.length;k+=2) p.push(a[k],a[k+1]);
        if(p.length<28) continue;                // trozo suelto: mas ruido que informacion
        for(let k=0;k<p.length;k+=2) meter(p[k],p[k+1]);
        out.push(p);
      }
    }
    return out;
  }

  /* ============================================================
     LA MANCHA
     El campo pintado como imagen: un pixel por celda de la malla, escalado con
     interpolacion. El color lo pone la temperatura y la opacidad la velocidad,
     de modo que el aire quieto no ensucia el plano y el que corre se ve.
     ============================================================ */
  const cvs=document.getElementById('plc');
  let cctx=null, cim=null;
  function mancha(F,g,s,ox,oy,vw,vh){
    if(!cvs || !F.malla) return;
    const M=F.malla, NX=M.NX, NY=M.NY, T=M.T, vx=M.vx, vy=M.vy, sol=M.sol;

    /* El lienzo mide exactamente una celda por pixel y se estira por CSS hasta
       cubrir la sala. Escalarlo aqui con drawImage costaba mas de cien
       milisegundos por redibujado; asi lo hace el compositor y sale gratis, con
       el mismo suavizado bilineal. */
    if(cvs.width!==NX||cvs.height!==NY){ cvs.width=NX; cvs.height=NY; cctx=null; cim=null; }
    if(!cctx) cctx=cvs.getContext('2d');
    if(!cim || cim.width!==NX || cim.height!==NY) cim=cctx.createImageData(NX,NY);
    cvs.style.left  =(ox/vw*100)+'%';
    cvs.style.top   =(oy/vh*100)+'%';
    cvs.style.width =(g.W*s/vw*100)+'%';
    cvs.style.height=(g.D*s/vh*100)+'%';

    /* Referencia de velocidad: la media del aire en movimiento, no el maximo.
       Junto a una singularidad la velocidad se dispara y, tomada como escala,
       dejaba todo lo demas saturado — la sala entera salia naranja. */
    let acc=0, nf=0, n=NX*NY;
    for(let k=0;k<n;k++) if(!sol[k]){ acc+=Math.hypot(vx[k],vy[k]); nf++; }
    const vr=(acc/(nf||1))*2.6;

    const px=cim.data;
    for(let k=0;k<n;k++){
      const q=heatL(T[k]);
      const m=Math.hypot(vx[k],vy[k]);
      let a=Math.min(1,m/vr);
      a=a*a*(3-2*a)*.46*(sol[k]?0:1);           // solo donde el aire corre, y nunca sobre el rack
      const o4=k*4;
      px[o4]=q[0]; px[o4+1]=q[1]; px[o4+2]=q[2]; px[o4+3]=(a*255)|0;
    }
    cctx.putImageData(cim,0,0);
  }

  let pendG=null, pendRaf=0;
  function queueDraw(g){
    pendG=g;
    if(pendRaf) return;
    pendRaf=requestAnimationFrame(()=>{pendRaf=0; draw(pendG);});
  }

  function draw(g){
    if(!pln) return;
    /* el viewBox se amolda a la proporcion de la sala, acotada para que ni una
       nave larguisima ni una casi cuadrada rompan la columna. Asi el dibujo
       llena su caja y el alto del bloque sigue al ancho, sin banda muerta. */
    const ar=Math.min(2.05,Math.max(1.02,g.W/g.D));
    const vw=VB.w, vh=Math.round(vw/ar);
    pln.setAttribute('viewBox','0 0 '+vw+' '+vh);
    const s=Math.min(vw/g.W, vh/g.D)*.90;
    const ox=(vw-g.W*s)/2, oy=(vh-g.D*s)/2;
    const X=m=>+(ox+m*s).toFixed(1), Y=m=>+(oy+m*s).toFixed(1), S=m=>+(m*s).toFixed(1);
    const rc=(x,y,w,h,f,extra)=>'<rect x="'+X(x)+'" y="'+Y(y)+'" width="'+S(w)+'" height="'+S(h)+'" fill="'+f+'"'+(extra||'')+'/>';
    /* el innerHTML se lleva por delante el <title> del marcado, y con el la
       etiqueta accesible del dibujo: se vuelve a emitir en cada pasada */
    let o='<title id="plnT">Planta esquemática: '+g.rows.length+' filas de racks, '
      +g.coldY.length+' pasillos fríos y '+(g.cool===2?g.nir+' unidades in-row':g.nper+' unidades perimetrales')
      +'. Sala de '+g.W.toFixed(1)+' por '+g.D.toFixed(1)+' metros.</title>';

    /* -- definiciones: el degradado del pasillo sin confinar -- */
    const fade=(.17*(1-g.byp*1.15)).toFixed(3);
    o+='<defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">'
      +'<stop offset="0" stop-color="'+COLD+'" stop-opacity=".04"/>'
      +'<stop offset=".5" stop-color="'+COLD+'" stop-opacity="'+fade+'"/>'
      +'<stop offset="1" stop-color="'+COLD+'" stop-opacity=".04"/></linearGradient>'
      +'</defs>';

    /* -- sala y losa de piso tecnico de 600 mm -- */
    o+=rc(0,0,g.W,g.D,'none',' stroke="rgba(227,230,235,.34)" stroke-width="2"');
    const nx=Math.floor(g.W/.6), ny=Math.floor(g.D/.6);
    if(nx+ny<220){
      let p='';
      for(let i=1;i<=nx;i++) p+='M'+X(i*.6)+' '+Y(0)+'V'+Y(g.D);
      for(let i=1;i<=ny;i++) p+='M'+X(0)+' '+Y(i*.6)+'H'+X(g.W);
      o+='<path d="'+p+'" stroke="rgba(227,230,235,.055)" stroke-width="1.3" fill="none"/>';
    }

    /* -- aire caliente: todo lo que no es pasillo frio ni rack es retorno. Con un
       solo par de filas el caliente vive contra los muros; con varios, ademas,
       en los pasillos de entre pares. La intensidad sigue a la densidad: mas kW
       por gabinete, mas caliente vuelve al clima. -- */

    /* -- aire frio: solido cuando el pasillo esta confinado, degradado que se
       desvanece por los bordes cuando no lo esta. Ese desvanecimiento es
       literalmente el aire que se va por arriba sin pasar por un rack. -- */
    const conf=g.cool>=1;

    /* -- confinamiento: el cerramiento del pasillo frio, con sus puertas -- */
    if(conf) g.coldY.forEach((y,i)=>{
      const yy=y-RD, hh=RD*2+g.cold, x=g.mh, w=g.W-2*g.mh;
      o+='<rect x="'+X(x)+'" y="'+Y(yy)+'" width="'+S(w)+'" height="'+S(hh)+'" fill="none"'
        +' stroke="rgba(227,230,235,.46)" stroke-width="2" stroke-dasharray="9 7"/>';
      /* puertas de los dos extremos */
      [x,x+w].forEach(px=>{
        o+='<line x1="'+X(px)+'" y1="'+Y(y)+'" x2="'+X(px)+'" y2="'+Y(y+g.cold)+'"'
          +' stroke="rgba(227,230,235,.82)" stroke-width="5"/>';
      });
    });

    /* -- filas: el cuerpo del rack en gris y una barra en la cara de aspiracion
       con el color de la temperatura que le llega. Ahi se ve el punto caliente. -- */
    const fb=Math.min(.16,RD*.13);
    g.rows.forEach(r=>{
      r.items.forEach(it2=>{
        if(it2.t==='u'){                       // unidad in-row
          o+=rc(it2.x,r.y,it2.w,RD,'rgba(227,230,235,.16)',' stroke="rgba(227,230,235,.62)" stroke-width="1.8"');
          o+=rc(it2.x+it2.w*.24,r.y+RD*.14,it2.w*.52,RD*.72,rgba(COLD,.8));
          return;
        }
        o+=rc(it2.x+.02,r.y,it2.w-.04,RD,'rgba(227,230,235,.34)');
        const fy=r.face==='down' ? r.y+RD-fb : r.y;
        o+=rc(it2.x+.02,fy,it2.w-.04,fb,heat(it2.T));
      });
    });

    /* -- unidades de clima -- */
    g.units.forEach(u=>{
      o+=rc(u.x,u.y,u.w,u.h,'rgba(227,230,235,.14)',' stroke="rgba(227,230,235,.62)" stroke-width="1.8"');
      o+=rc(u.x+u.w*.10,u.y+u.h*.30,u.w*.80,u.h*.40,rgba(COLD,.75));
    });

    /* -- CAMPO DE AIRE ------------------------------------------------------
       Dos capas. La mancha va en canvas: es un raster de la malla, coloreado por
       temperatura y con la opacidad atada a la velocidad, asi que se ve donde
       hay aire moviendose y se apaga donde esta parado. Pintarlo como
       rectangulos en el SVG serian miles de nodos; asi son seis mil pixeles que
       el navegador interpola solo, y sale la mancha continua.
       Encima, las lineas de corriente, cada una de una pieza y con la marca
       corriendo por ella: eso es el movimiento. */
    const F=campo(g);
    mancha(F,g,s,ox,oy,vw,vh);

    const st2=lineas(F,g,180);
    st2.forEach((p,idx)=>{
      let d='M'+X(p[0])+' '+Y(p[1]);
      for(let k=2;k<p.length;k+=2) d+='L'+X(p[k])+' '+Y(p[k+1]);
      const mi=(p.length>>2)*2;
      o+='<path d="'+d+'" fill="none" stroke="'+heat(F.temp(p[mi],p[mi+1]))+'"'
        +' stroke-opacity=".62" stroke-width="2.1" stroke-linecap="round"'
        /* solo una de cada cuatro lleva la marca corriendo: animar las 180
           obliga al navegador a repintar todos los trazos en cada fotograma, y
           un trazo SVG no va por GPU. Con una de cada cuatro se lee igual. */
        +(idx%4===0 ? ' class="'+(idx%8?'pf':'pf2')+'"' : '')+'/>';
    });

    /* -- cotas -- */
    const fm=n=>n.toLocaleString('es-CO',{maximumFractionDigits:1})+' m';
    o+='<text x="'+X(g.W/2)+'" y="'+(Y(0)-9)+'" text-anchor="middle" fill="rgba(227,230,235,.42)"'
      +' font-size="12" letter-spacing="1.6">'+fm(g.W)+'</text>';
    o+='<text transform="translate('+(X(0)-11)+','+Y(g.D/2)+') rotate(-90)" text-anchor="middle"'
      +' fill="rgba(227,230,235,.42)" font-size="12" letter-spacing="1.6">'+fm(g.D)+'</text>';

    pln.innerHTML=o;

    /* -- lecturas del pie -- */
    const f1=n=>n.toLocaleString('es-CO',{minimumFractionDigits:1,maximumFractionDigits:1});
    const a=Math.round(g.Tin), b=Math.round(g.Tmax);
    el('pT').textContent=(a===b?a:a+'–'+b)+' °C';
    el('pB').textContent=Math.round(g.byp*100)+' %';
    el('pU').textContent = g.cool===2 ? g.nir+' in-row + '+g.nper
      : (g.cabe ? g.nper+' CRAH' : g.units.length+' de '+g.nper+' CRAH');
    el('pF').textContent=g.rows.length+' · '+g.coldY.length;

    /* -- el aviso: lo unico que cambia de tono, y solo cuando el diseno no da -- */
    const nt=el('pN'); let msg='', warn=false;
    if(!g.cabe){
      msg='La carga pide '+g.nper+' unidades perimetrales y contra los muros solo caben '+
          g.units.length+', ya en doble hilera. A '+g.kw+' kW por gabinete el perímetro se '+
          'queda corto: el frío tiene que nacer en la fila.';
      warn=true;
    } else if(g.Tmax>27){
      msg='Los racks más alejados del clima llegan a '+f1(g.Tmax)+' °C en la aspiración, por encima '+
          'de los 27 °C recomendados por ASHRAE. Confinar el pasillo frío o acercar el equipo a la fila.';
      warn=true;
    } else if(g.cool===0){
      msg='Sin confinar, el '+Math.round(g.byp*100)+' % del aire frío vuelve al clima sin haber pasado '+
          'por un gabinete. Ese aire se paga dos veces: se enfría y no refrigera.';
    } else {
      msg='Pasillo frío confinado: el aire llega igual al primer rack de la fila que al último, '+
          'y el gradiente de la sala se aplana a '+f1(g.Tmax-g.Tin)+' °C.';
    }
    if(g.truncado) msg+=' El dibujo representa '+MAXR+' de los '+(+R.value)+' gabinetes.';
    nt.textContent=msg; nt.classList.toggle('warn',warn);
  }

  function calc(anim=true){
    const racks=+R.value, kw=+K.value;
    const it = racks*kw;
    const pue = PUE[cool];
    const tot = it*pue*RED[tier];
    const ups = Math.ceil(it*RED[tier]/0.9/25)*25;
    const tr  = it*3.517/12;                       // kW -> toneladas de refrigeración
    /* El area sale del dibujo, no de un coeficiente: se mide la sala que hace
       falta para meter esas filas con esos pasillos, mas un 16 % de pasillos
       transversales, rampas y PDU. El modelo anterior (m² por kW TI) inflaba
       la sala a densidades altas — 168 racks de 30 kW daban 7,7 m² por rack. */
    const g   = geom(racks, kw, tier, cool);
    const area= Math.max(24, g.W*g.D*1.16);
    queueDraw(g);

    vR.textContent=racks; vK.textContent=kw+' kW';
    vT.textContent=ROM[tier]; vC.textContent=CN[cool];
    el('oTop').textContent=TOP[tier];

    const nx={IT:it,Tot:tot,UPS:ups,TR:tr,A:area,P:pue};
    if(!anim){ paint(nx); return; }
    gsap.to(out,{...nx,duration:.7,ease:'power2.out',onUpdate:()=>paint(out)});
  }
  function paint(o){
    el('oIT').innerHTML  = fmt(o.IT)+'<em>kW</em>';
    el('oTot').innerHTML = fmt(o.Tot)+'<em>kW</em>';
    el('oUPS').innerHTML = fmt(o.UPS)+'<em>kVA</em>';
    el('oTR').innerHTML  = fmt(o.TR)+'<em>TR</em>';
    el('oA').innerHTML   = fmt(o.A)+'<em>m²</em>';
    el('oP').textContent = fmt(o.P,2);
  }
  R.oninput=()=>calc(); K.oninput=()=>calc();
  document.querySelectorAll('#segT button').forEach(b=>b.onclick=()=>{
    document.querySelectorAll('#segT button').forEach(x=>x.classList.remove('on'));
    b.classList.add('on'); tier=+b.dataset.t-1; calc();
  });
  document.querySelectorAll('#segC button').forEach(b=>b.onclick=()=>{
    document.querySelectorAll('#segC button').forEach(x=>x.classList.remove('on'));
    b.classList.add('on'); cool=+b.dataset.c; calc();
  });
  calc(false);

  /* ---------- plegado ----------
     El simulador llega cerrado. Quien venia leyendo la pagina se encontraba de
     golpe media pantalla de controles que no habia pedido; el que si quiere
     dimensionar una sala, pulsa. El titulo y el parrafo se quedan fuera: son
     los que cuentan que esto existe.

     `hidden` lo saca del flujo entero, no es un alto cero que siga ocupando.
     Como `height:auto` no se puede animar, al abrir se mide el alto real y se
     va hasta el; al terminar se devuelve a `auto`, o la caja se quedaria
     clavada en los pixeles de ese momento y no seguiria al contenido cuando
     cambie el ancho de la ventana. */
  var caja = document.getElementById('cfw'), go = document.getElementById('cfgGo');
  if (caja && go){
    var texto = go.querySelector('.t'), abierto = false, yendo = null;

    function pintar(){
      go.setAttribute('aria-expanded', abierto ? 'true' : 'false');
      texto.textContent = abierto ? 'Cerrar el simulador' : 'Abrir el simulador';
      go.classList.toggle('on', abierto);
    }

    function abrir(){
      caja.hidden = false;
      /* la planta se redibuja con la caja ya en el flujo: mientras estuvo en
         `display:none` el navegador no le dio caja al SVG */
      calc(false);
      if (RM){ gsap.set(caja, {clearProps:'all'}); ScrollTrigger.refresh(); return; }
      if (yendo) yendo.kill();
      yendo = gsap.fromTo(caja,
        {height:0, opacity:0, overflow:'hidden'},
        {height:caja.scrollHeight, opacity:1, duration:.75, ease:'power3.inOut',
         onComplete:function(){ gsap.set(caja, {clearProps:'height,opacity,overflow'}); ScrollTrigger.refresh(); }});
    }

    function cerrar(){
      if (RM){ caja.hidden = true; ScrollTrigger.refresh(); return; }
      if (yendo) yendo.kill();
      yendo = gsap.to(caja, {height:0, opacity:0, overflow:'hidden', duration:.5, ease:'power3.inOut',
        onComplete:function(){ caja.hidden = true; gsap.set(caja, {clearProps:'height,opacity,overflow'}); ScrollTrigger.refresh(); }});
    }

    go.addEventListener('click', function(){
      abierto = !abierto;
      pintar();
      if (abierto) abrir(); else cerrar();
    });
    pintar();
  }

  /* el flujo solo se anima mientras el configurador esta en pantalla */
  const cja=document.querySelector('.plan');
  if(cja) ScrollTrigger.create({trigger:'#cfg', start:'top bottom', end:'bottom top',
    onToggle:st=>cja.classList.toggle('run', st.isActive)});
})();

/* ============================================================
   ACORDEÓN
   ============================================================ */
document.querySelectorAll('.acc .it').forEach(it=>{
  const bo=it.querySelector('.bo');
  if (it.classList.contains('op')) bo.style.maxHeight=bo.scrollHeight+'px';
  it.querySelector('.hd').onclick=()=>{
    const was=it.classList.contains('op');
    it.parentElement.querySelectorAll('.it').forEach(o=>{o.classList.remove('op');o.querySelector('.bo').style.maxHeight=null});
    if(!was){ it.classList.add('op'); bo.style.maxHeight=bo.scrollHeight+'px'; }
  };
});

/* ============================================================
   ENTREGABLES · seis tarjetas con foto
   ------------------------------------------------------------
   Mismo componente que las del inicio. La cortina va en el marco (clip-path) y
   el parallax en la imagen (yPercent): el tilt del puntero toca x/y/scale de la
   imagen, así que ninguno de los tres se pisa.
   ============================================================ */
(function(){
  var ent = document.querySelector('.ent-tri'); if (!ent) return;
  gsap.utils.toArray('.ent-tri .c').forEach(function(c, i){
    var im = c.querySelector('img');
    gsap.fromTo(c, {clipPath:'inset(0 0 100% 0)'}, {clipPath:'inset(0 0 0% 0)',
      duration:1.4, delay:i * .08, ease:'expo.out', scrollTrigger:{trigger:ent, start:'top 84%'}});
    gsap.from(c.querySelectorAll('.tx > *'), {y:26, opacity:0, duration:1, stagger:.08,
      delay:.3 + i * .08, ease:'power3.out', scrollTrigger:{trigger:ent, start:'top 84%'}});
    gsap.fromTo(im, {yPercent:-6}, {yPercent:6, ease:'none',
      scrollTrigger:{trigger:c, start:'top bottom', end:'bottom top', scrub:true}});
  });
})();

/* ============================================================
   POR QUÉ · cuatro tarjetas con foto
   ------------------------------------------------------------
   Cada columna viaja a su propia velocidad, así que la fila se abre en
   escalera con el scroll en vez de subir en bloque. Dentro de cada marco la
   foto se desplaza aparte (yPercent ±7): el CSS la hace 118% de alta para que
   ese recorrido nunca descubra el fondo.

   Se animan propiedades distintas en elementos distintos a propósito: el marco
   lleva el clip-path y el tilt (rotate), la foto el yPercent del parallax y la
   escala/x/y del tilt, la tarjeta el `y` de la columna. Si dos tweens tocaran
   la misma propiedad del mismo elemento, el `overwrite` del tilt mataría al
   parallax.
   ============================================================ */
(function(){
  var fila = document.querySelector('.wy'); if (!fila) return;
  var ancho = innerWidth > 860;
  gsap.utils.toArray('.wy-c').forEach(function(c, i){
    var marco = c.querySelector('.wy-im'), im = marco.querySelector('img');
    gsap.fromTo(marco, {clipPath:'inset(100% 0 0 0)'}, {clipPath:'inset(0% 0 0 0)',
      duration:1.5, ease:'expo.out', delay: ancho ? i*.09 : 0,
      scrollTrigger:{trigger: ancho ? fila : c, start:'top 84%'}});
    gsap.from(c.querySelector('.wy-tx'), {y:30, opacity:0, duration:1.1, ease:'power3.out',
      delay: ancho ? .25 + i*.09 : .2,
      scrollTrigger:{trigger: ancho ? fila : c, start:'top 84%'}});
    gsap.fromTo(im, {yPercent:-7}, {yPercent:7, ease:'none',
      scrollTrigger:{trigger:c, start:'top bottom', end:'bottom top', scrub:true}});
    if (ancho && !RM){
      var v = [24, 84, 44, 110][i];
      gsap.fromTo(c, {y:v}, {y:-v, ease:'none',
        scrollTrigger:{trigger:fila, start:'top bottom', end:'bottom top', scrub:1.1, invalidateOnRefresh:true}});
    }
  });
})();

/* banner: la foto mide 120% y arranca en -10%. Un recorrido de ±7% de su alto
   son ±8,4% de la sección, dentro de ese sobrante: nunca asoma el borde. (Antes
   iba de 0 a +14% y al salir por arriba descubría una franja.) */
gsap.fromTo('.bnr > img', {yPercent:-7, scale:1.08}, {yPercent:7, scale:1, ease:'none',
  scrollTrigger:{trigger:'.bnr', start:'top bottom', end:'bottom top', scrub:true}});
gsap.from('.bnr ul li',{y:20,opacity:0,duration:.75,stagger:.06,scrollTrigger:{trigger:'.bnr ul',start:'top 90%'}});
gsap.from('.bnr .std .i',{y:22,opacity:0,duration:.9,stagger:.06,ease:'power3.out',
  scrollTrigger:{trigger:'.bnr .std',start:'top 88%'}});

/* sectores */
/* ============================================================
   SECTORES + PROCESO · la segunda pista horizontal
   ------------------------------------------------------------
   Mismo montaje que la de servicios: el lienzo se queda pegado y la pista se
   desplaza. Cada entrada va con `containerAnimation` porque las tarjetas se
   mueven dentro de esa animación y no con el scroll de la página.

   `refreshPriority:0.5` — por debajo del modelo (2) y de servicios (1), que
   están más arriba: cada pin debe medirse con los espaciadores de los de
   encima ya colocados.
   ============================================================ */
(function(){
  var sec = document.getElementById('deck2'); if (!sec) return;
  var tr = document.getElementById('hztr2'), pin = document.getElementById('hz2'), bar = document.getElementById('hzb2');
  var fases = gsap.utils.toArray('.pz-f', tr);

  if (innerWidth <= 860 || RM) {
    gsap.from(gsap.utils.toArray('.pz-c, .pz-f', tr), {y:40, opacity:0, duration:.9, stagger:.05,
      scrollTrigger:{trigger:sec, start:'top 80%'}});
    fases.forEach(function(f){ f.classList.add('on'); });
    return;
  }

  var pad = function(){ return parseFloat(getComputedStyle(document.body).getPropertyValue('--pad')) || 40; };
  var dist = function(){ return Math.max(0, tr.scrollWidth - innerWidth + pad()*2); };
  var mueve = gsap.timeline({scrollTrigger:{trigger:sec, start:'top top', end:function(){ return '+=' + dist(); },
    pin:pin, scrub:1, invalidateOnRefresh:true, anticipatePin:1, refreshPriority:0.5}})
    .to(tr, {x:function(){ return -dist(); }, ease:'none'}, 0)
    .fromTo(bar, {scaleX:0}, {scaleX:1, ease:'none'}, 0);

  gsap.utils.toArray('.pz-tit, .pz-c, .pz-f', tr).forEach(function(pn){
    gsap.fromTo(pn.children, {x:64, opacity:0}, {x:0, opacity:1, stagger:.04, ease:'none',
      scrollTrigger:{trigger:pn, containerAnimation:mueve, start:'left 104%', end:'left 66%', scrub:true}});
  });
  /* cada tarjeta se enciende al cruzar: se dibuja su regla superior */
  gsap.utils.toArray('.pz-c, .pz-f', tr).forEach(function(f){
    ScrollTrigger.create({trigger:f, containerAnimation:mueve, start:'left 62%', end:'right left',
      onToggle:function(st){ f.classList.toggle('on', st.isActive); }});
  });
})();

/* ============================================================
   CLIENTES · dos filas en sentidos opuestos
   ------------------------------------------------------------
   Cada fila es un bucle continuo: la pista se duplica y se anima justo la
   mitad de su ancho, así el corte cae sobre una copia idéntica y no se ve el
   salto. Encima, tres capas que reaccionan al scroll:

     · la velocidad del scroll acelera el bucle;
     · el sentido del scroll invierte el avance (al subir, las tarjetas vuelven);
     · un sesgo (skewX) proporcional a la velocidad, que se relaja solo.

   El ancho se vuelve a medir en cada refresh: si cambia el tamaño de la
   ventana, la mitad ya no es la misma y el bucle saltaría.
   ============================================================ */
(function(){
  var vp = document.getElementById('cliVp'); if (!vp || typeof gsap === 'undefined') return;
  var filas = gsap.utils.toArray('.cli-fila', vp).map(function(fila, i){
    var pista = fila.querySelector('.cli-pista');
    pista.dataset.base = pista.innerHTML;
    return {fila:fila, pista:pista, dir: i ? 1 : -1, seg: i ? 52 : 38, tl:null, skew:null};
  });

  function montar(f){
    if (f.tl) { f.tl.kill(); f.tl = null; }
    f.skew = null;
    var p = f.pista;
    p.innerHTML = p.dataset.base;

    /* Una fila puede no estar en pantalla: la segunda se oculta por debajo de
       860 px. Y una fila oculta mide CERO.

       Aquí había un `while (p.scrollWidth < innerWidth*2) p.innerHTML += base`
       que en ese caso no terminaba nunca: duplicaba HTML contra un ancho que
       jamás crecía hasta tumbar la pestaña. En un móvil la página se quedaba
       colgada con el precargador a medio contar, y no había error en la
       consola que lo delatara — el hilo simplemente no volvía.

       Ahora se mide una vez: sin ancho no se monta, y las copias se calculan
       en vez de buscarse a tientas. Cuando la fila vuelva a tener ancho
       —girar el teléfono, ensanchar la ventana— el `refreshInit` la monta. */
    var uno = p.scrollWidth;
    if (!uno) return;
    /* el tope es el cinturón: si por lo que sea `uno` saliera diminuto, mejor
       un hueco en el carrusel que diez mil tarjetas en el DOM */
    var copias = Math.min(20, Math.max(1, Math.ceil(innerWidth * 2 / uno)));
    if (copias > 1) p.innerHTML = p.dataset.base.repeat(copias);
    p.innerHTML += p.innerHTML;
    var mitad = p.scrollWidth / 2;
    gsap.set(p, {x: f.dir < 0 ? 0 : -mitad});
    f.tl = gsap.to(p, {x: f.dir < 0 ? -mitad : 0, duration: f.seg, ease:'none', repeat:-1});
    f.skew = gsap.quickTo(p, 'skewX', {duration:.5, ease:'power3'});
  }
  filas.forEach(montar);
  if (!RM) ScrollTrigger.addEventListener('refreshInit', function(){ filas.forEach(montar); });

  if (RM) { filas.forEach(function(f){ f.tl && f.tl.pause(); }); return; }

  ScrollTrigger.create({trigger:vp, start:'top bottom', end:'bottom top',
    onUpdate:function(s){
      var v = s.getVelocity();
      var factor = 1 + Math.min(Math.abs(v) / 1400, 3.6);
      filas.forEach(function(f){
        if (!f.tl) return;                 /* fila oculta: no hay nada que acelerar */
        gsap.to(f.tl, {timeScale: (v < 0 ? -1 : 1) * factor, duration:.45, overwrite:true});
        f.objetivo = gsap.utils.clamp(-7, 7, v / -260) * f.dir;
      });
    }});
  /* El sesgo se relaja solo. `onUpdate` únicamente dispara mientras hay scroll:
     sin esto, al soltar la rueda las tarjetas se quedarían torcidas. */
  gsap.ticker.add(function(){
    filas.forEach(function(f){
      if (!f.skew) return;                 /* idem: sin montar no hay a quien torcer */
      f.actual = gsap.utils.interpolate(f.actual || 0, f.objetivo || 0, .08);
      f.objetivo = (f.objetivo || 0) * .9;
      f.skew(f.actual);
    });
  });

  /* profundidad: las dos filas se desplazan un poco en vertical, a distinto paso */
  filas.forEach(function(f, i){
    gsap.fromTo(f.fila, {y: i ? 26 : 16}, {y: i ? -26 : -16, ease:'none',
      scrollTrigger:{trigger:vp, start:'top bottom', end:'bottom top', scrub:1.1}});
  });
})();
gsap.fromTo('#fw',{xPercent:-4},{xPercent:-14,ease:'none',scrollTrigger:{trigger:'#fw',start:'top bottom',end:'bottom top',scrub:true}});

/* ============================================================
   CURSOR
   ============================================================ */
if (!TOUCH){
  const c=document.getElementById('cr'), x=document.getElementById('cx');
  const cX=gsap.quickTo(c,'x',{duration:.1}), cY=gsap.quickTo(c,'y',{duration:.1});
  const xX=gsap.quickTo(x,'x',{duration:.5,ease:'power3'}), xY=gsap.quickTo(x,'y',{duration:.5,ease:'power3'});
  addEventListener('mousemove',e=>{cX(e.clientX);cY(e.clientY);xX(e.clientX);xY(e.clientY)});
  document.querySelectorAll('a,button,.wy-im,.pz-c,.pz-f,.ent-tri .c,.sv,.acc .hd,input[type=range]').forEach(el=>{
    el.addEventListener('mouseenter',()=>document.body.classList.add('big'));
    el.addEventListener('mouseleave',()=>document.body.classList.remove('big'));
  });
}

/* ============================================================
   FORM · COOKIE
   ============================================================ */
document.getElementById('fm').addEventListener('submit',e=>{
  e.preventDefault();
  let ok=true;
  ['a1','a2','a4','a6'].forEach(id=>{
    const el=document.getElementById(id);
    if(!el.value.trim()){ok=false; gsap.fromTo(el,{x:-7},{x:0,duration:.55,ease:'elastic.out(1,.35)'}); el.style.borderColor='currentColor'; el.style.borderBottomWidth='2px';}
    else { el.style.borderColor=''; el.style.borderBottomWidth=''; }
  });
  if(!ok) return;
  /* No hay servidor: la solicitud se redacta y se abre WhatsApp con el texto
     puesto. Lo compone `js/wa.js`, que es el mismo que usa el asistente del
     botón flotante — un solo formato para las dos vías. */
  e.target.dispatchEvent(new CustomEvent('wa:enviar'));
  document.getElementById('ok').classList.add('s');
  gsap.from('#ok',{y:14,opacity:0,duration:.6});
  e.target.reset();
});
document.querySelectorAll('.fd input,.fd textarea').forEach(el=>el.addEventListener('input',()=>{el.style.borderColor='';el.style.borderBottomWidth='';}));
/* ============================================================
   AVISO DE COOKIES
   ------------------------------------------------------------
   Aceptar tiene que significar algo: se guarda y no se vuelve a preguntar. Si
   el navegador no deja guardar -modo privado, almacenamiento bloqueado- el
   aviso reaparecera en la siguiente visita, que es molesto pero correcto; lo
   que no puede es reventar, de ahi los `try`.

   Y al aceptarlo se quita con `display:none` en vez de dejarlo desplazado
   fuera de la pantalla: un cuadro invisible pero presente sigue estando en el
   arbol de accesibilidad y puede volver a asomar por un par de pixeles segun
   la altura de la ventana.
   ============================================================ */
(function(){
  var ck = document.getElementById('ck'), cko = document.getElementById('cko');
  if (!ck || !cko) return;
  var LLAVE = 'datcer:cookies';

  var aceptado = false;
  try { aceptado = localStorage.getItem(LLAVE) === '1'; } catch (e) {}
  if (aceptado) { ck.style.display = 'none'; return; }

  cko.onclick = function(){
    try { localStorage.setItem(LLAVE, '1'); } catch (e) {}
    gsap.to(ck, {y:'160%', opacity:0, duration:.7, ease:'power3.in',
      onComplete:function(){ ck.style.display = 'none'; }});
  };
})();

/* ============================================================
   EFECTOS EXTRA
   ============================================================ */
/* botones magnéticos */
if (!TOUCH){
  document.querySelectorAll('.btn, .sl-nav button').forEach(b=>{
    const xT=gsap.quickTo(b,'x',{duration:.5,ease:'power3'}), yT=gsap.quickTo(b,'y',{duration:.5,ease:'power3'});
    b.addEventListener('mousemove',e=>{
      const r=b.getBoundingClientRect();
      xT((e.clientX-r.left-r.width/2)*.32); yT((e.clientY-r.top-r.height/2)*.42);
    });
    b.addEventListener('mouseleave',()=>{xT(0);yT(0)});
  });
}
/* sesgo sutil de las imágenes según la velocidad del scroll */
(function(){
  if (RM) return;
  const med=[...document.querySelectorAll('[data-med] img')];
  if(!med.length) return;
  const set=gsap.quickSetter(med,'skewY','deg');
  let cur=0;
  ScrollTrigger.create({start:0,end:'max',onUpdate:s=>{
    const v=gsap.utils.clamp(-4,4,s.getVelocity()/-420);
    if(Math.abs(v)>Math.abs(cur)) cur=v;
  }});
  gsap.ticker.add(()=>{ cur=gsap.utils.interpolate(cur,0,.08); set(cur); });
})();
/* líneas divisorias que se dibujan */
gsap.utils.toArray('.figs, .std, .acc').forEach(el=>{
  gsap.from(el,{opacity:0,duration:.9,scrollTrigger:{trigger:el,start:'top 90%'}});
});

/* refresh */
addEventListener('load',()=>ScrollTrigger.refresh());
let rt; addEventListener('resize',()=>{clearTimeout(rt); rt=setTimeout(()=>{
  splitMap.clear();
  document.querySelectorAll('[data-split="line"]').forEach(el=>el.dataset.bound='');
  ScrollTrigger.refresh();
},250)});

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
  /* Arriba del todo la cabecera va sobre el marco perla del hero: texto oscuro
     y logo original. El marco se cierra en el primer ~50 % del tramo de espera
     (--hx en `abre()`); pasado ese punto la cabecera ya está sobre la foto. */
  var hold = document.querySelector('.cover .hold');
  /* en móvil el hero va sin marco (--hx:0): ahí no hay perla que pisar */
  var heroEl = document.getElementById('hero');
  if (heroEl && hold && getComputedStyle(heroEl).getPropertyValue('--hx').trim() !== '0') {
    /* El borde superior del marco mide ~10vh y se cierra con --hx en el 52 %
       del tramo. No hay un punto en que el texto quede limpio a los dos lados,
       así que se aprovecha que la cabecera se esconde al bajar pasados 460 px:
       se mantiene perla casi hasta ahí (~430 px, marco aún de ~40 px) y el
       cambio a claro coincide con su salida. */
    /* Se calcula en cada actualización y en cada refresh, no con onToggle: con
       start:0 y la página arriba del todo, ScrollTrigger no lo daba por activo
       al cargar y la cabecera arrancaba con el logo claro sobre el perla. */
    var limite = function(){ return hold.offsetHeight * .32; };
    var perla = function(){ hd.classList.toggle('perla', (ln ? ln.scroll : window.scrollY) < limite()); };
    ScrollTrigger.create({start:0, end:'max', onUpdate:perla, onRefresh:perla});
    perla();
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
