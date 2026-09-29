/* ============================================================
   DATCER · servicios
   ------------------------------------------------------------
   La página comparte el sistema visual de index.html pero no su main.js: aquel
   engancha secciones que aquí no existen y reventaría a la primera. Lo que se
   repite abajo es el núcleo común —preloader, cabecera, menú, split, reveals—
   y de ahí en adelante todo es propio de esta página.

   Es el mismo núcleo duplicado que ya tiene shelters.js. Si se toca el sistema
   de animación, hay que tocarlo en los tres sitios.
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
    .from('#sv-hero .tag', {yPercent:120, opacity:0, duration:1}, .1)
    .from(splitMap.get(document.querySelector('#sv-hero h1')) || [],
          {yPercent:112, duration:1.35, stagger:.09, ease:'expo.out'}, .2)
    .from('#sv-hero .ft', {y:40, opacity:0, duration:1.1}, .7)
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
    if (el.closest('#sv-hero')) return;
    gsap.from(splitMap.get(el)||[], {yPercent:112, duration:1.15, stagger:.075, ease:'expo.out',
      scrollTrigger:{trigger:el, start:'top 87%'}});
  });
  ScrollTrigger.refresh();
});
document.querySelectorAll('[data-anim="up"]').forEach(el=>{
  if (el.closest('#sv-hero')) return;
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
   LAS FILAS DE SERVICIO
   ------------------------------------------------------------
   Cada servicio es una fila con la foto a un lado y el texto al otro,
   alternando. Dentro de la fila, las tres capas —el número de fondo, la foto y
   el texto— recorren distancias distintas sobre el mismo scroll: de esa
   diferencia sale la profundidad, sin que nada se escale ni se deforme.

   El número apenas se mueve porque esta al fondo; el texto es el que mas viaja
   porque esta al frente. Es la misma regla de los paneles de la puerta.
   ============================================================ */
/* Cada tarjeta se destapa de abajo arriba y su foto viaja dentro del marco a
   distinta velocidad que el resto: eso es lo que da la profundidad. El alto del
   114 % y el -7 % de arranque (en el CSS) son el margen de ese viaje; ponerlo
   con una escala lo borraría el tilt, que escribe la suya al pasar el puntero. */
gsap.utils.toArray('.sv-grid .c').forEach(function(c, i){
  var im = c.querySelector('img'), col = i % 3;
  gsap.fromTo(c, {clipPath:'inset(0 0 100% 0)'}, {clipPath:'inset(0 0 0% 0)',
    duration:1.4, delay:col * .09, ease:'expo.out', scrollTrigger:{trigger:c, start:'top 88%'}});
  gsap.from(c.querySelectorAll('.tx > *'), {y:26, opacity:0, duration:1, stagger:.09,
    delay:.28 + col * .09, ease:'power3.out', scrollTrigger:{trigger:c, start:'top 88%'}});
  /* en movil la foto va en el flujo, arriba de la ficha (servicios.css): el
     viaje del parallax abriria un hueco sobre ella */
  if (!RM && innerWidth > 1080) gsap.fromTo(im, {yPercent:-6}, {yPercent:6, ease:'none',
    scrollTrigger:{trigger:c, start:'top bottom', end:'bottom top', scrub:true}});
});

/* ============================================================
   TILT 3D EN LAS FOTOS
   ------------------------------------------------------------
   El mismo de index.html: el marco gira siguiendo al puntero y la imagen se
   desplaza al contrario que el texto. Ese contraste es el que da la sensacion
   de profundidad — si los dos fueran en la misma direccion, seria un empuje.
   ============================================================ */
if (!TOUCH) document.querySelectorAll('[data-tilt]').forEach(function(pn){
  var im = pn.querySelector('img');
  var tx = pn.querySelector('.tx');
  pn.addEventListener('mousemove', function(e){
    var r = pn.getBoundingClientRect();
    var px = (e.clientX - r.left)/r.width - .5, py = (e.clientY - r.top)/r.height - .5;
    gsap.to(pn, {rotateY:px*7, rotateX:-py*6, duration:.9, ease:'power3.out', overwrite:'auto'});
    if (im) gsap.to(im, {scale:1.05, x:-px*18, y:-py*14, duration:1, ease:'power3.out', overwrite:'auto'});
    if (tx) gsap.to(tx, {x:px*10, duration:1, ease:'power3.out', overwrite:'auto'});
  });
  pn.addEventListener('mouseleave', function(){
    gsap.to(pn, {rotateY:0, rotateX:0, duration:1.1, ease:'expo.out'});
    if (im) gsap.to(im, {scale:1, x:0, y:0, duration:1.2, ease:'expo.out'});
    if (tx) gsap.to(tx, {x:0, duration:1.2, ease:'expo.out'});
  });
});

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


/* El vídeo del hero: viaja con el scroll y solo se reproduce mientras se ve.
   Diez segundos de taller no tienen por qué seguir decodificando cuando la
   página ya va por la rejilla. */
(function(){
  var v = document.getElementById('svbg'); if (!v) return;
  if (!RM) gsap.fromTo(v, {yPercent:-5}, {yPercent:5, ease:'none',
    scrollTrigger:{trigger:'#sv-hero', start:'top top', end:'bottom top', scrub:true}});
  ScrollTrigger.create({trigger:'#sv-hero', start:'top bottom', end:'bottom top',
    onToggle:function(st){ st.isActive ? v.play().catch(function(){}) : v.pause(); }});
})();
