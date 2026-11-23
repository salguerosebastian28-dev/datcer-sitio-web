/* ============================================================
   DATCER · bancos de carga — pagina de servicio (SEO)
   ------------------------------------------------------------
   Mismo nucleo que shelters.js (preloader, cabecera, menu, split, reveals),
   sin la pasarela 3D. Generado a partir de shelters.js: si se corrige algo
   del nucleo alli, corregirlo tambien aqui.
   ============================================================ */
/* «Reducir movimiento» del sistema NO apaga los efectos: decision del
   cliente (oct. 2026). Muchos telefonos lo activan con el ahorro de
   bateria y la pagina se quedaba quieta. RM se deja en false, no se borra,
   para poder volver atras cambiando una linea. */
const RM = false;
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
  var hero = document.getElementById('bc-hero'), hd = document.getElementById('hd');
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
  var im = document.querySelector('#bc-hero .bc-bg video, #bc-hero .bc-bg img'); if (!im) return;
  if (!RM) {
    gsap.fromTo(im, {scale:1.12}, {scale:1, duration:2.2, ease:'expo.out'});
    gsap.fromTo(im, {yPercent:-6}, {yPercent:6, ease:'none',
      scrollTrigger:{trigger:'#bc-hero', start:'top top', end:'bottom top', scrub:true}});
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
    .from('#bc-hero .tag', {yPercent:120, opacity:0, duration:1}, .1)
    .from(splitMap.get(document.querySelector('#bc-hero h1')) || [],
          {yPercent:112, duration:1.35, stagger:.09, ease:'expo.out'}, .2)
    .from('#bc-hero .ft', {y:40, opacity:0, duration:1.1}, .7)
    .from('#hd, #sc', {opacity:0, duration:.9}, .6)
    .to('#ch', {opacity:1, duration:.8}, .9);
}
listo.then(()=>{ doSplits(); arranque(); });
function arranque(){
/* Seguro: si el dispositivo va tan lento que la animacion de carga no avanza,
   a los 4 s reales se completa igual y la pagina se libera. */
const tlPre = gsap.timeline({onComplete:()=>{document.body.classList.remove('lock'); heroIn(); ScrollTrigger.refresh(); irAlAncla();}});
setTimeout(()=>{ if (tlPre.progress() < 1) tlPre.progress(1); }, 4000);
tlPre
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
  brillo('.bc-tbl li b');
  document.querySelectorAll('[data-split="line"]').forEach(el=>{
    if (el.closest('#bc-hero')) return;
    gsap.from(splitMap.get(el)||[], {yPercent:112, duration:1.15, stagger:.075, ease:'expo.out',
      scrollTrigger:{trigger:el, start:'top 87%'}});
  });
  ScrollTrigger.refresh();
});
document.querySelectorAll('[data-anim="up"]').forEach(el=>{
  if (el.closest('#bc-hero')) return;
  gsap.from(el,{y:38, opacity:0, duration:1.1, scrollTrigger:{trigger:el, start:'top 92%'}});
});
document.querySelectorAll('.bc-tbl li').forEach(el=>{
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
