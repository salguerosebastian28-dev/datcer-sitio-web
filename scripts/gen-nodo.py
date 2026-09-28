# -*- coding: utf-8 -*-
"""Genera js/nodo.js a partir de assets/NODO-data-center.html.

El dibujo del canvas son líneas minificadas de cientos de caracteres: copiarlas
a mano es la forma segura de meter un error. Se extraen tal cual y se les aplican
reemplazos exactos, cada uno comprobado (si un patrón no aparece, el script
falla en vez de dejarlo a medias)."""
import io, os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
L = io.open('assets/NODO-data-center.html', encoding='utf-8').read().split(u'\n')

topologia = u'\n'.join(L[116:162])      # líneas 117-162: NODO_POWER
app = u'\n'.join(L[166:313])            # líneas 167-313: el dibujo y la lógica

def rep(s, a, b, n=1):
    k = s.count(a)
    assert k >= 1, u'no encontrado: ' + a[:80]
    if n == 'all':
        return s.replace(a, b)
    assert k == n, u'%d apariciones (esperaba %d): %s' % (k, n, a[:80])
    return s.replace(a, b)

topologia = rep(topologia, u'const NODO_POWER=', u'const DC_POWER=')

# ---------- cabecera, raíz y selectores acotados a #nodo ----------
app = rep(app, u'''/* NODO — A continuous, scroll-driven technical drawing.
   Illustrative dimensions and systems; not a construction document. */
(() => {
'use strict';
const canvas=document.getElementById('blueprint');let c=canvas.getContext('2d');
const electrical=NODO_POWER,''', u'''const root=document.getElementById('nodo');if(!root)return;
const canvas=document.getElementById('nd-canvas');let c=canvas.getContext('2d');
const electrical=DC_POWER,''')
app = rep(app, u"const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];",
               u"const $=s=>root.querySelector(s),$$=s=>[...root.querySelectorAll(s)];")

# ---------- paleta ----------
app = rep(app, u"const C={ink:'#cdd8c5',dim:'#647d6a',green:'#c9f582',blue:'#89cddd',amber:'#e6bd7c',red:'#e59b8d',dark:'#101915'};",
               u"const C={ink:'#cdd6e4',dim:'#5f7089',green:'#7fb0ff',blue:'#6fd6c6',amber:'#e6bd7c',red:'#e59b8d',dark:'#020d1f'};")
app = rep(app, u"g==='B'?'#b8b1ff'", u"g==='B'?'#c9a0ff'")
COLORES = {
 u"'#1b2a20'":u"'#0c1a31'", u"'#14231b'":u"'#091528'", u"'#162219'":u"'#0a1629'", u"'#203123'":u"'#0f1f38'",
 u"'#728974'":u"'#6f8098'", u"'#435a48'":u"'#34465f'", u"'#526b5655'":u"'#4a5d7855'", u"'#9dae91'":u"'#9aa9bf'",
 u"'#273a2a'":u"'#16263f'", u"'#708b6d'":u"'#62748f'", u"'#24372c'":u"'#13243c'", u"'#758970'":u"'#71839b'",
 u"'#34503950'":u"'#28406050'", u"'#34503945'":u"'#28406045'", u"'#b4bea7'":u"'#b3bdcc'", u"'#68775c'":u"'#5b6a80'",
 u"'#a2af96'":u"'#a1adbf'", u"'#4a6046'":u"'#415570'", u"'#9aab90'":u"'#98a7bb'", u"'#506548'":u"'#465a74'",
 u"'#a4b69212'":u"'#a4b4cc12'", u"'#36482df2'":u"'#1c2d47f2'", u"'#2d402ce8'":u"'#172840e8'", u"'#92a28660'":u"'#8b9bb360'",
 u"'#46553d'":u"'#34465e'", u"'#89cddd40'":u"'#6fd6c640'", u"'#89cddd0a'":u"'#6fd6c60a'", u"'#89cddd12'":u"'#6fd6c612'",
 u"'#89cddd11'":u"'#6fd6c611'", u"'#e8edc444'":u"'#dfe8f844'",
}
for a, b in COLORES.items():
    app = rep(app, a, b, 'all')
app = rep(app, u"coord:'A verde · B violeta · PE discontinuo'", u"coord:'A azul · B violeta · PE discontinuo'")
app = rep(app, u"'Courier New',monospace", u"ui-monospace,Consolas,'Courier New',monospace")

# ---------- ids y clases con prefijo ----------
app = rep(app, u"$('#kicker')", u"$('#nd-kicker')")
app = rep(app, u"$('#title')", u"$('#nd-title')")
app = rep(app, u"$('#description')", u"$('#nd-desc')")
app = rep(app, u"[['metric1','m1'],['metric2','m2'],['label1','l1'],['label2','l2'],['sheet','sheet'],['coord','coord'],['view','view']]",
               u"[['nd-m1','m1'],['nd-m2','m2'],['nd-l1','l1'],['nd-l2','l2'],['nd-sheet-t','sheet'],['nd-coord','coord'],['nd-view','view']]")
app = rep(app, u"$$('.phase')", u"$$('.nd-phase')", 2)
app = rep(app, u"$('.systems')", u"$('.nd-systems')")
app = rep(app, u"$('.final-note')", u"$('.nd-final')")
app = rep(app, u"gsap.fromTo('.copy',{opacity:.25,y:12}", u"gsap.fromTo($('.nd-copy'),{opacity:.25,y:12}")
app = rep(app, u"$('.progress')", u"$('.nd-progress')")
app = rep(app, u"$('#percentage')", u"$('#nd-pct')")
app = rep(app, u"$$('.system')", u"$$('.nd-system')")
app = rep(app, u";$('.brand').addEventListener('click',e=>{e.preventDefault();navigate(0)});", u";")
app = rep(app, u"document.getElementById('electrical-report')", u"document.getElementById('nd-report')")
app = rep(app, u"document.getElementById('electrical-notes')", u"document.getElementById('nd-notes')")
app = rep(app, u"document.getElementById('electrical-table')", u"document.getElementById('nd-table')")
app = rep(app, u"document.getElementById('electrical-canvas')", u"document.getElementById('nd-report-canvas')")
app = rep(app, u"document.getElementById('electrical-open')", u"document.getElementById('nd-open')")
app = rep(app, u"document.getElementById('electrical-close')", u"document.getElementById('nd-close')")

# ---------- navegación: con el scroll suave del sitio ----------
app = rep(app, u"window.scrollTo({top:y,behavior:'smooth'});}",
               u"if(typeof ln!=='undefined'&&ln)ln.scrollTo(y,{duration:1.4});else window.scrollTo({top:y,behavior:'smooth'});}")

# ---------- el pin y la línea de tiempo ----------
a = app.index(u"if(window.gsap&&window.ScrollTrigger&&!reduced){")
b = app.index(u"function tick(ms)")
app = app[:a] + u'''/* El pin. Mismo guion que el original, pero con el GSAP y el scroll suave del
   sitio (el original traía su propio GSAP 3.13 embebido) y más corto: cinco
   pantallas en vez de seis.
   `refreshPriority:2` — este pin mete miles de píxeles de espaciador muy arriba
   en la página. Si se refrescara después que los disparadores de más abajo,
   todos calcularían su posición sin contarlo y quedarían corridos (ya pasó con
   el pin de servicios, que lleva prioridad 1). */
if(window.gsap&&window.ScrollTrigger&&!reduced){
 const tl=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:root,pin:$('.nd-vp'),start:'top top',
  end:()=>'+='+Math.max(innerHeight*5.8,4200),scrub:1.15,invalidateOnRefresh:true,anticipatePin:1,refreshPriority:2},onUpdate:update});
 tl.to(state,{p:1,duration:10},0).to(state,{plan:1,duration:1.8},1.2).to(state,{unifilar:0,duration:1.7},1.3).to(state,{iso:.22,duration:1.2},3.8).to(state,{racks:1,duration:2},4.4).to(state,{iso:1,duration:1.8},4.8).to(state,{systems:1,duration:1.8},6.1).to(state,{build:1,duration:1.8},7.3).to(state,{roof:1,duration:1.1},8.8);
 tl.to($('.nd-grid'),{backgroundPosition:'0px -170px',duration:10},0);scrollTrigger=tl.scrollTrigger;
 /* Salida hacia la foto de la sala, todavía con el lienzo fijo. Primero se
    apaga la interfaz (fases, barra, línea de progreso, textos); después el
    edificio avanza hacia la cámara mientras se disuelve. Sin este tramo el pin
    soltaba la barra de fases pegada al borde de la foto, de golpe. `state.p`
    sigue midiendo solo los diez primeros tiempos, así que las fases no cambian. */
 tl.to($('.nd-ui'),{opacity:0,y:-24,duration:.9,ease:'power1.in'},10)
   .to($('.nd-grid'),{opacity:0,duration:1},10.1)
   .to($('.nd-drawing'),{scale:1.22,opacity:0,duration:1.5,ease:'power1.in'},10.15);
 /* la entrada, cuando la sección llega a pantalla y no al cargar la página */
 /* El plano llega CON el cruce, ligado al scroll: cuando la sección termina de
    tapar el hero ya está dibujado. Va sobre el <canvas> y no sobre .nd-drawing
    porque ese marco lleva la salida (opacidad y escala) en la línea de tiempo
    del pin; dos tweens con scrub sobre la misma opacidad se reescriben al
    refrescar y el plano podía quedar visible o apagado donde no toca. */
 gsap.fromTo(canvas,{opacity:0,scale:.9,yPercent:6},{opacity:1,scale:1,yPercent:0,ease:'none',
  scrollTrigger:{trigger:root,start:'top 95%',end:'top 15%',scrub:true}});
 gsap.fromTo($('.nd-rail'),{y:50},{y:0,ease:'none',scrollTrigger:{trigger:root,start:'top 60%',end:'top top',scrub:true}});
 /* El texto NO lleva entrada propia: setPhase ya le anima la opacidad con
    overwrite:true, y dos tweens de opacidad sobre .nd-copy se pisaban y dejaban
    la primera fase a medio encender. */
 /* fuera el indicador de capítulo mientras el modelo ocupa la pantalla */
 const ch=document.getElementById('ch');
 if(ch)ScrollTrigger.create({trigger:root,start:'top 40%',end:'bottom 60%',
  onToggle:st=>ch.classList.toggle('nd-oculto',st.isActive)});
 ScrollTrigger.sort();
}else{$('.nd-hint').innerHTML='Selecciona una etapa para explorar';}
/* El original redibujaba el canvas cada 32 ms siempre, estuviera donde estuviera
   la página: los puntos que recorren los circuitos no paran nunca. Aquí solo se
   dibuja con la sección a la vista. */
let enVista=false;
new IntersectionObserver(e=>{enVista=e[0].isIntersecting;if(enVista)needsDraw=true},{rootMargin:'120px'}).observe(root);
''' + app[b:]
app = rep(app, u"if(document.hidden||ms-last<32)return;", u"if(document.hidden||!enVista||ms-last<32)return;")

salida = u'''/* ============================================================
   DEL UNIFILAR AL EDIFICIO — el diseño de un data center, con el scroll
   ------------------------------------------------------------
   Un plano técnico continuo dibujado en canvas: el unifilar se convierte en
   planta, la planta se llena de racks en axonometría y el edificio se levanta
   con sus cuatro sistemas. Dimensiones y sistemas ilustrativos; no es un
   documento de construcción.

   GENERADO por scripts/gen-nodo.py desde assets/NODO-data-center.html. Si
   hay que cambiar el dibujo, se cambia la fuente y se regenera: las líneas del
   canvas vienen minificadas y a mano es muy fácil romperlas.
   ============================================================ */
(() => {
'use strict';
''' + topologia + u'\n\n' + app + u'\n})();\n'
io.open('js/nodo.js', 'w', encoding='utf-8').write(salida)
print('js/nodo.js', len(salida), 'caracteres')
