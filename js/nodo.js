/* ============================================================
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
/* Single source of truth for the conceptual electrical topology and its 3D equipment.
   ATS normal/emergency inputs are interlocked; A and B are not bus-coupled.
   Ratings, selectivity, autonomy and fault levels are intentionally unspecified. */
const DC_POWER=(()=>{
 const nodes=[],edges=[],racks=[];
 const add=(id,label,d,w,group,kind='cabinet',size=[18,17,29])=>nodes.push({id,label,d,w,group,kind,size});
 const link=(from,to,group,mode='normal',via=[])=>edges.push({from,to,group,mode,via,breaker:mode==='earth'?null:'Q-'+from+'-'+to});
 for(const [i,s] of ['A','B'].entries()){
  const x=i?160:-160,outer=i?310:-310,wx=i?-184:-233;
  add('MT-'+s,'ACOMETIDA '+s,[x,-240],[wx,-240,0],s,'source');
  add('TR-'+s,'MT / BT',[x,-188],[wx,-207,0],s,'transformer',[26,25,30]);
  add('GE-'+s,'GRUPO BT',[outer,-154],[i?-125:-275,-249,0],s,'generator',[38,29,27]);
  add('ATS-'+s,'RED / GRUPO',[x,-130],[wx,-159,0],s);
  add('TGBT-'+s,'BARRA BT',[x,-73],[wx,-135,0],s);
  add('UPS-'+s,'DOBLE CONVERSIÓN',[x,0],[wx,-111,0],s);
  add('BAT-'+s,'DC',[i?248:-248,0],[i?-157:-259,-111,0],s,'battery',[13,18,25]);
  add('PDU-'+s,'DISTRIBUCIÓN IT',[x,72],[wx,-85,0],s);
  add('RACK-'+s,'48 rPDU '+s,[x,160],[i?239:-100,-145,0],s,'aggregate');
  add('TM-'+s,'TABLERO MECÁNICO',[outer,-44],[wx,-40,0],s);
  add('CRAH-'+s,'UNIDAD INTERIOR',[outer,30],[wx,7,0],s,'cooler',[30,31,30]);
  add('UE-'+s,'FRÍO + BOMBEO',[outer,103],[i?92:-194,-150,124],s,'roof',[95,42,18]);
  link('MT-'+s,'TR-'+s,s);link('TR-'+s,'ATS-'+s,s);link('GE-'+s,'ATS-'+s,s,'standby',[[outer,-130]]);
  link('ATS-'+s,'TGBT-'+s,s);link('TGBT-'+s,'UPS-'+s,s);link('BAT-'+s,'UPS-'+s,s,'battery');link('UPS-'+s,'PDU-'+s,s);link('PDU-'+s,'RACK-'+s,s);
  link('TGBT-'+s,'TM-'+s,s,'normal',[[outer,-73]]);
  link('TM-'+s,'CRAH-'+s,s);link('TM-'+s,'UE-'+s,s,'normal',[[i?376:-376,-44],[i?376:-376,103]]);
 }
 add('TSG','SERVICIOS GENERALES',[-310,200],[-25,148,0],'A');
 add('SG','LUZ / TOMAS / AUX.',[-160,225],[120,150,0],'A','aggregate');
 link('TGBT-A','TSG','A','normal',[[-393,-73],[-393,200]]);link('TSG','SG','A');
 add('STS','SELECTOR A / B',[0,34],[-215,83,0],'critical');
 add('TSC','SERVICIOS CRÍTICOS',[0,97],[-181,83,0],'critical');
 add('CTRL','NOC · BMS · ACCESO',[0,151],[-204,120,0],'critical','control',[42,17,14]);
 add('PCI','DETECCIÓN + BAT.',[0,205],[-245,147,0],'critical','panel',[15,12,24]);
 link('UPS-A','STS','A','normal',[[-47,0],[-47,34]]);link('UPS-B','STS','B','standby',[[47,0],[47,34]]);
 link('STS','TSC','critical');link('TSC','CTRL','critical');link('TSC','PCI','critical','normal',[[68,97],[68,205]]);
 for(let row=0;row<4;row++)for(let col=0;col<12;col++)racks.push({id:`R${String(row*12+col+1).padStart(2,'0')}`,row,col,inputs:['PDU-A','PDU-B'],position:[-91+col*27,-143+row*57,42]});
 return {nodes,edges,racks,earth:{id:'BPT',bonds:['TR-A','TR-B','GE-A','GE-B','TGBT-A','TGBT-B','UPS-A','UPS-B','PDU-A','PDU-B','TM-A','TM-B','TSG','TSC','PCI','CRAH-A','CRAH-B','UE-A','UE-B','ESTRUCTURA','48 RACKS']},notes:[
  'A y B: cadenas separadas. Cada ATS selecciona red o grupo mediante enclavamiento, sin paralelismo.',
  'IT: UPS-A/B con baterías y bypass estático interno → PDU-A/B → 48 racks con dos rPDU independientes.',
  'Clima: TGBT-A/B → TM-A/B → CRAH-A/B y enfriadoras UE-A/B con bombeo integrado. Respaldo de grupo; estas cargas no pasan por la UPS IT.',
  'TSG desde TGBT-A: iluminación, tomas y auxiliares; respaldo GE-A, con interrupción durante transferencia.',
  'TSC desde STS de UPS-A/B: NOC, BMS, control de acceso y panel de detección/extinción PCI con batería propia.',
  'BPT: equipotencialidad de equipos, racks y estructura. PE no es un enlace entre las barras activas A y B.',
  'Arquitectura conceptual: sin tensiones, potencias, calibres, autonomía ni coordinación de protecciones calculadas; no acredita 2N ni un nivel Tier.'
 ]};
})();

const root=document.getElementById('nodo');if(!root)return;
const canvas=document.getElementById('nd-canvas');let c=canvas.getContext('2d');
const electrical=DC_POWER, byId=Object.fromEntries(electrical.nodes.map(n=>[n.id,n]));
const powerColor=g=>g==='B'?'#c9a0ff':g==='critical'?'#e8d8b0':C.green;
const $=s=>root.querySelector(s),$$=s=>[...root.querySelectorAll(s)];
const C={ink:'#cdd6e4',dim:'#5f7089',green:'#7fb0ff',blue:'#6fd6c6',amber:'#e6bd7c',red:'#e59b8d',dark:'#020d1f'};
const state={p:0,iso:0,plan:0,racks:0,build:0,systems:0,roof:0,unifilar:1};
const visible={power:true,cooling:true,data:true,fire:true};
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let W=800,H=560,t=0,phase=-1,last=0,scrollTrigger,needsDraw=true;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,p)=>a+(b-a)*p;
const phases=[
 {k:'01 / Ingeniería eléctrica',title:'Todo empieza <br>con una <br><em>conexión.</em>',desc:'Dos cadenas eléctricas alimentan el edificio. Los mismos equipos y circuitos aparecen en el unifilar, la planta y la construcción.',m1:'A / B',l1:'CADENAS SEPARADAS',m2:'A + B',l2:'ALIMENTACIÓN DUAL',sheet:'E-001 / Unifilar general del edificio',coord:'A azul · B violeta · PE discontinuo',view:'Vista esquemática',alt:'Unifilar general: acometidas MT-A/B, TR-A/B, grupos GE-A/B, ATS-A/B, TGBT-A/B, UPS y baterías A/B, PDU-A/B y 48 racks; tableros mecánicos TM-A/B, TSG, STS, TSC, PCI y puesta a tierra BPT.'},
 {k:'02 / Arquitectura',title:'La energía <br>encuentra <br><em>su lugar.</em>',desc:'El esquema se convierte en espacio. Accesos, salas técnicas y circulaciones ordenan la planta del edificio.',m1:'1.200',l1:'M² DE PLANTA',m2:'6',l2:'ZONAS FUNCIONALES',sheet:'A-101 / Planta arquitectónica',coord:'Accesos · operación · infraestructura',view:'Planta / 40 × 30 m',alt:'Planta conceptual de 40 por 30 metros, con sala de datos, sala eléctrica, climatización, sala de control, acceso y carga.'},
 {k:'03 / Infraestructura IT',title:'Un núcleo. <br>Millones de <br><em>conexiones.</em>',desc:'Los racks ocupan su posición. Pasillos fríos, alimentación dual y rutas de fibra dan forma al corazón del data center.',m1:'48',l1:'RACKS IT',m2:'4',l2:'FILAS DE SERVIDORES',sheet:'DC-201 / Distribución del data center',coord:'Racks · pasillos fríos · rutas A/B',view:'Axonometría / Equipamiento',alt:'Vista axonométrica con 48 racks distribuidos en cuatro filas, contención de pasillos fríos, equipos UPS y climatización.'},
 {k:'04 / Construcción e integración',title:'Cada sistema. <br>Un solo <br><em>edificio.</em>',desc:'La estructura se eleva. Energía, refrigeración, datos y seguridad se integran en una arquitectura que permanece conectada.',m1:'4',l1:'SISTEMAS INTEGRADOS',m2:'48',l2:'RACKS CONECTADOS',sheet:'B-301 / Edificio integrado · Sección abierta',coord:'Estructura + envolvente + sistemas',view:'Axonometría / Corte técnico',alt:'Edificio en sección abierta con estructura, cubierta, fachada, data center, rutas eléctricas, refrigeración, fibra y detección y extinción de incendios.'}
];
function setPhase(i){if(i===phase)return;phase=i;const d=phases[i];$('#nd-kicker').textContent=d.k;$('#nd-title').innerHTML=d.title;$('#nd-desc').textContent=d.desc;for(const [id,key] of [['nd-m1','m1'],['nd-m2','m2'],['nd-l1','l1'],['nd-l2','l2'],['nd-sheet-t','sheet'],['nd-coord','coord'],['nd-view','view']])$('#'+id).textContent=d[key];canvas.setAttribute('aria-label',d.alt);$$('.nd-phase').forEach((el,n)=>{el.classList.toggle('active',n===i);if(n===i)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current')});$('.nd-systems').classList.toggle('visible',i===3);$('.nd-final').classList.toggle('visible',i===3);if(window.gsap&&!reduced)gsap.fromTo($('.nd-copy'),{opacity:.25,y:12},{opacity:1,y:0,duration:.55,overwrite:true});}
function project(x,y,z=0){const p=state.iso;return [lerp(x,(x-y)*.79,p),lerp(y,(x+y)*.38-z,p)+p*54];}
function path(points,color=C.ink,width=1,fill=null,close=false){c.beginPath();points.forEach((v,i)=>{const p=project(...v);i?c.lineTo(...p):c.moveTo(...p)});if(close)c.closePath();if(fill){c.fillStyle=fill;c.fill()}if(color){c.strokeStyle=color;c.lineWidth=width;c.stroke()}}
function line(a,b,color=C.dim,width=1){path([a,b],color,width)}
function rect(x,y,w,h,color=C.ink,fill=null,z=0,width=1){path([[x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z]],color,width,fill,true)}
function text(s,x,y,color=C.dim,size=10,z=0,align='center'){const p=project(x,y,z);c.fillStyle=color;c.font=`${size}px ui-monospace,Consolas,'Courier New',monospace`;c.textAlign=align;c.fillText(s,p[0],p[1])}
function dot(x,y,z,color,r=2){const p=project(x,y,z);c.beginPath();c.arc(...p,r,0,Math.PI*2);c.fillStyle=color;c.fill()}
function box(x,y,w,d,h,color=C.ink,z=0,fill='#0c1a31'){rect(x,y,w,d,color,fill,z+h);path([[x,y+d,z],[x+w,y+d,z],[x+w,y+d,z+h],[x,y+d,z+h]],color,.8,fill,true);path([[x+w,y,z],[x+w,y+d,z],[x+w,y+d,z+h],[x+w,y,z+h]],color,.8,'#091528',true)}
function dim(a,b,label,offset=0){line(a,b,C.dim,.65);for(const p of [a,b])line([p[0]-4,p[1]-4,p[2]||0],[p[0]+4,p[1]+4,p[2]||0],C.ink,.8);text(label,(a[0]+b[0])/2,(a[1]+b[1])/2-8+offset,C.dim,9)}
function route(points,color,progress=1,animate=true){const lengths=[];let total=0;for(let i=1;i<points.length;i++){const n=Math.hypot(...points[i].map((v,j)=>v-(points[i-1][j]||0)));lengths.push(n);total+=n}let rem=total*progress;const pts=[points[0]];for(let i=0;i<lengths.length&&rem>0;i++){const f=Math.min(1,rem/lengths[i]);pts.push(points[i+1].map((v,j)=>lerp(points[i][j]||0,v,f)));rem-=lengths[i]}path(pts,color,1.55);if(animate&&!reduced&&progress>.95){let distance=(t*26)%total;for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]){const f=distance/lengths[i];const p=points[i+1].map((v,j)=>lerp(points[i][j]||0,v,f));dot(...p,color,2.3);break}distance-=lengths[i]}}}
function circuit(){
 const a=state.unifilar;if(a<.005)return;c.save();c.globalAlpha=a;c.translate(0,-state.plan*80);
 text('CADENA A',-160,-273,powerColor('A'),12);text('CADENA B',160,-273,powerColor('B'),12);
 // Edges and nodes come from the same topology as the physical building.
 for(const e of electrical.edges){const f=byId[e.from],to=byId[e.to],col=powerColor(e.group);const pts=[f.d,...e.via,to.d].map(p=>[...p,0]);
  if(e.mode!=='normal')c.setLineDash([4,4]);route(pts,col,1,e.mode==='normal');c.setLineDash([]);
  // A small Q symbol denotes a branch protective device, not a wire junction.
  {let seg=0,len=0;for(let j=1;j<pts.length;j++){const d=Math.hypot(pts[j][0]-pts[j-1][0],pts[j][1]-pts[j-1][1]);if(d>len){len=d;seg=j}}if(len>36){const x=(pts[seg][0]+pts[seg-1][0])/2,y=(pts[seg][1]+pts[seg-1][1])/2;rect(x-3,y-3,6,6,col,C.dark);line([x-3,y+3],[x+3,y-3],col,.7)}}
 }
 for(const n of electrical.nodes){const [x,y]=n.d,col=powerColor(n.group),w=n.kind==='aggregate'?112:n.id==='CTRL'?126:84;
  rect(x-w/2,y-15,w,30,col,C.dark,0,n.kind==='source'?.7:1.1);
  text(n.id,x,y-1,col,10);text(n.label,x,y+10,C.ink,6.8);
  if(n.id.startsWith('ATS')){text('N ↔ E · ENCLAVADO',x+62,y+3,C.dim,6,0,'left')}
 }
 rect(-220,139,440,42,C.dim,null,0,.5);text('48 RACKS · DOS ENTRADAS SEPARADAS POR RACK',0,184,C.dim,7);
 c.setLineDash([5,4]);line([-382,255],[382,255],C.dim,.8);for(const x of [-310,-160,0,160,310])line([x,248],[x,255],C.dim,.8);c.setLineDash([]);
 text('BPT / PE · CARCASAS + RACKS + ESTRUCTURA · SIN UNIR BARRAS A/B',0,269,C.dim,8);
 text('Q = PROTECCIÓN   ·   - - = RESERVA / DC   ·   UPS: BYPASS INTERNO',0,291,C.dim,7);
 c.restore();
}
function floor(){
 const a=state.plan;if(a<.005)return;c.save();c.globalAlpha=a;const p=state.build;
 rect(-310,-280,620,490,C.dim,'#0a1629',-8*p);box(-260,-180,520,360,8*p,'#6f8098',-8*p,'#0f1f38');
 c.save();c.globalAlpha*=.42;for(let x=-260;x<=260;x+=20)line([x,-180],[x,180],'#34465f',.5);for(let y=-180;y<=180;y+=20)line([-260,y],[260,y],'#34465f',.5);c.restore();
 rect(-260,-180,520,360,C.ink,null,0,2);rect(-252,-172,504,344,C.dim,null,0,.65);
 // Six functional zones, and a continuous service corridor.
 line([-150,-180],[-150,180],C.ink,2);line([-260,-60],[-150,-60],C.ink,1.8);line([-260,60],[-150,60],C.ink,1.8);line([-110,-180],[-110,180],C.ink,1.8);line([-110,100],[260,100],C.ink,1.8);line([80,100],[80,180],C.ink,1.8);
 c.save();c.globalAlpha*=1-state.racks*.8;
 text('SALA ELÉCTRICA',-205,-126,C.ink,8);text('UPS / BATERÍAS',-205,-111,C.dim,7);text('CLIMATIZACIÓN',-205,-6,C.ink,8);text('NOC / CONTROL',-205,118,C.ink,8);text('SALA DE DATOS',75,-40,C.green,14);text('ÁREA IT',75,-20,C.dim,9);text('ACCESO SEGURO',-15,143,C.ink,9);text('CARGA / SOPORTE',172,143,C.ink,9);c.restore();
 // Door swings are kept flat in the architectural drawing.
 if(state.iso<.5){for(const [x,y] of [[-150,-110],[-150,8],[-150,127],[-110,-22],[0,100],[155,100],[0,180]]){c.strokeStyle=C.dark;c.lineWidth=4;c.beginPath();c.moveTo(x,y);c.lineTo(x,y+22);c.stroke();c.strokeStyle=C.dim;c.lineWidth=.7;c.beginPath();c.arc(x,y,22,0,Math.PI/2);c.stroke();line([x,y],[x+22,y],C.ink,.8)}}
 for(let x=-260;x<=260;x+=104){for(const y of [-180,100,180])rect(x-3,y-3,6,6,C.ink,C.ink);line([x,-215],[x,208],'#4a5d7855',.6);text(String.fromCharCode(65+(x+260)/104),x,-226,C.dim,9)}
 dim([-260,-202],[260,-202],'40.00 m');dim([286,-180],[286,180],'30.00 m',0);dim([-260,205],[-110,205],'SERVICIOS');dim([-110,205],[260,205],'OPERACIÓN');
 // Site access and north arrow.
 line([0,180],[0,226],C.green,1);path([[-5,218],[0,227],[5,218]],C.green);text('ACCESO',0,242,C.dim,8);
 line([-305,-168],[-305,-198],C.ink);path([[-310,-189],[-305,-200],[-300,-189]],C.ink);text('N',-305,-210,C.ink,10);
 c.restore();
}
function equipment(){if(state.racks<.001)return;c.save();c.globalAlpha=state.racks;
 for(let row=0;row<4;row++){const y=-143+row*57;
 if(row%2===0)rect(-95,y+24,338,30,'#6fd6c640','#6fd6c60a');
 for(let col=0;col<12;col++){const x=-91+col*27;const reveal=clamp(state.racks*2-(col+row*3)/25);const h=42*reveal;box(x,y,21,25,h,'#9aa9bf',0,'#16263f');
 if(state.iso>.08){for(let z=6;z<h-2;z+=6){line([x+3,y+25,z],[x+18,y+25,z],'#62748f',.7);dot(x+17,y+25,z,C.green,1)}}else{line([x+4,y+5],[x+17,y+5],C.dim,.7);line([x+4,y+19],[x+17,y+19],C.dim,.7)}
 }
 text('R0'+(row+1),-103,y+16,C.dim,8,0,'right');
 }
 for(const n of electrical.nodes){if(n.kind==='source'){dot(n.w[0],n.w[1],0,powerColor(n.group),3);text(n.id,n.w[0],n.w[1]-9,powerColor(n.group),7);continue}if(['aggregate','roof'].includes(n.kind))continue;const [x,y,z]=n.w,[w,d,h]=n.size,col=powerColor(n.group);box(x-w/2,y-d/2,w,d,h*state.racks,col,z,'#13243c');text(n.id,x,y+d/2+9,col,6.8,z);}
 // Separate A and B rack PDUs on each physical cabinet.
 for(const r of electrical.racks){const [x,y,z]=r.position;for(const [i,s] of ['A','B'].entries())line([x+3+i*14,y+25,3],[x+3+i*14,y+25,z*state.racks],powerColor(s),1.1)}
 for(let x=110;x<225;x+=34)box(x,125,26,26,16*state.racks,C.dim);
 c.restore();}
function powerNetworks(a){
 const z=lerp(3,68,state.build),height=n=>n.w[2]+n.size[2]*state.racks;
 for(const e of electrical.edges){const f=byId[e.from],n=byId[e.to];if(n.kind==='aggregate')continue;
  const p=[f.w[0],f.w[1],height(f)],q=[n.w[0],n.w[1],height(n)];
  if(e.mode!=='normal')c.setLineDash([3,3]);
  let routeZ=e.to.startsWith('UE')?130*state.build:z+(e.group==='B'?7:0);
  route([p,[p[0],p[1],routeZ],[p[0],q[1],routeZ],[q[0],q[1],routeZ],q],powerColor(e.group),a,e.mode==='normal');c.setLineDash([]);
 }
 for(const [i,s] of ['A','B'].entries()){
  const p=byId['PDU-'+s],spine=i?247:-106,col=powerColor(s),h=z+i*8;
  route([[p.w[0],p.w[1],height(p)],[p.w[0],-172+i*8,h],[spine,-172+i*8,h],[spine,61,h]],col,a);
  for(let row=0;row<4;row++){const y=-143+row*57+4+i*14;route([[spine,y,h],[i?-90:232,y,h]],col,a);
   for(const r of electrical.racks.filter(r=>r.row===row)){const [x,ry,rh]=r.position;line([x+3+i*14,y,h],[x+3+i*14,ry+25,rh],col,.65)}
  }
 }
 // General-services branch: luminaires and socket outlets on the entrance zone.
 const sg=byId.TSG;route([[sg.w[0],sg.w[1],29],[sg.w[0],166,60],[220,166,60]],C.green,a);
 for(const x of [-25,45,120,205]){line([x,166,60],[x,166,8],C.green,.6);rect(x-3,164,6,5,C.green,null,8);rect(x-12,160,24,5,C.ink,'#dfe8f844',85*state.build);line([x,166,60],[x,162,85*state.build],C.green,.5)}
 // Protective bonding is deliberately distinct from live power conductors.
 c.setLineDash([3,4]);rect(-300,-280,600,468,C.dim,null,1,.7);for(const n of electrical.nodes.filter(n=>!['source','aggregate','roof'].includes(n.kind)))path([[n.w[0],n.w[1],1],[-300,n.w[1],1]],C.dim,.45);for(const r of electrical.racks)path([[r.position[0],r.position[1],1],[r.position[0],188,1]],C.dim,.4);for(const n of electrical.nodes.filter(n=>n.kind==='roof'))path([[n.w[0],n.w[1],142*state.build],[n.w[0],n.w[1],1],[-300,n.w[1],1]],C.dim,.45);for(const x of [-260,260])path([[x,-180,120*state.build],[x,-180,1],[-300,-180,1]],C.dim,.45);c.setLineDash([]);text('BPT / PE',-267,202,C.dim,8);
}
function networks(){const a=state.systems;if(a<.001)return;c.save();c.globalAlpha=a;const z=lerp(2,68,state.build);
 if(visible.power)powerNetworks(a);
 if(visible.cooling){for(const s of ['A','B']){const u=byId['UE-'+s],v=byId['CRAH-'+s];route([[u.w[0],u.w[1],142*state.build],[v.w[0],u.w[1],58],[v.w[0],v.w[1],30]],C.blue,a)}route([[-233,7,30],[-125,7,58],[-125,-110,58],[243,-110,58]],C.blue,a);route([[-184,7,30],[-125,7,58],[-125,3,58],[243,3,58]],C.blue,a);for(const y of [-109,5]){rect(-95,y,338,14,C.blue,'#6fd6c612',52*state.build);for(let x=-70;x<240;x+=50)path([[x,y+4,50*state.build],[x,y+4,22],[x-4,y+4,27]],C.blue,.8)}}
 if(visible.data){route([[-204,113,18],[-130,113,76],[-130,79,76],[240,79,76],[240,-139,76]],C.amber,a);for(let row=0;row<4;row++)route([[240,-130+row*57,76],[-90,-130+row*57,76]],C.amber,a)}
 if(visible.fire){route([[-248,148,15],[-248,148,94],[-125,148,94],[-125,40,94],[248,40,94],[248,-169,94]],C.red,a);for(const y of [-155,-43,66]){route([[248,y,94],[-99,y,94]],C.red,a,false);for(let x=-70;x<235;x+=80){dot(x,y,94,C.red,2);line([x,y,94],[x,y,86],C.red,.7)}}for(let y=122;y<=152;y+=10)box(-245,y,9,7,25,C.red);}
 c.restore();}
function structure(){if(state.build<.001)return;c.save();c.globalAlpha=state.build;const h=120*state.build;
 // Rear opaque facades and load-bearing frame, front open for system visibility.
 path([[-260,-180,0],[260,-180,0],[260,-180,h],[-260,-180,h]],'#71839b',1,'#28406050',true);
 path([[-260,-180,0],[-260,180,0],[-260,180,h],[-260,-180,h]],'#71839b',1,'#28406045',true);
 for(let x=-260;x<=260;x+=104){box(x-3,-183,6,6,h,'#b3bdcc',0,'#5b6a80');box(x-3,177,6,6,h*.68,'#a1adbf',0,'#415570');line([x,-180,h],[x,180,h],C.ink,1);}
 for(let y=-180;y<=180;y+=90){line([-260,y,h],[260,y,h],C.dim,1);if(y>-180&&y<180)box(-263,y-3,6,6,h,'#98a7bb',0,'#465a74')}
 line([-260,-180,h],[260,-180,h],C.ink,2);line([-260,180,h],[260,180,h],C.ink,2);
 // Mullions, fire compartment and secure entry.
 for(let x=-250;x<260;x+=26)line([x,-180,35],[x,-180,h-10],C.dim,.6);
 rect(-260,-180,110,360,C.dim,null,h);rect(-250,100,95,65,C.blue,'#6fd6c611',h+1);
 box(-40,178,70,8,55*state.build,C.ink,0,'#a4b4cc12');line([-5,178,0],[-5,178,55*state.build],C.ink);
 // Partial roof slides down to meet the frame; central cutaway stays open.
 const drop=(1-state.roof)*65;if(state.roof>.001){c.save();c.globalAlpha*=state.roof;rect(-270,-190,540,78,C.ink,'#1c2d47f2',h+drop+4);rect(-270,-112,116,302,C.ink,'#172840e8',h+drop+4);for(let x=-260;x<260;x+=13)line([x,-190,h+drop+5],[x,-113,h+drop+5],'#8b9bb360',.55);
 for(const n of electrical.nodes.filter(n=>n.kind==='roof')){const [x,y]=n.w,[w,d,hh]=n.size;box(x-w/2,y-d/2,w,d,hh,C.dim,h+drop+5,'#34465e');text(n.id,x,y+d/2+9,C.ink,8,h+drop+5);for(const dx of [-23,23]){const p=project(x+dx,y,h+drop+24);c.beginPath();c.ellipse(p[0],p[1],12,6,0,0,Math.PI*2);c.strokeStyle=C.ink;c.lineWidth=.7;c.stroke()}}

 c.restore()}c.restore();}
function draw(){c.clearRect(0,0,W,H);const s=Math.min(W/(state.unifilar>.5?870:850),H/(state.unifilar>.5?650:600));c.save();c.translate(W*.5,H*.5+10);c.scale(s,s);floor();equipment();networks();structure();circuit();c.restore();}
function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);W=r.width;H=r.height;canvas.width=W*d;canvas.height=H*d;c.setTransform(d,0,0,d,0,0);needsDraw=true;draw()}
function update(){const p=state.p;setPhase(p<.235?0:p<.48?1:p<.735?2:3);$('.nd-progress').style.transform=`scaleX(${p})`;$('#nd-pct').textContent=String(Math.round(p*100)).padStart(2,'0')+' — 100';needsDraw=true;}
function fallbackAt(p){state.p=p;state.plan=clamp((p-.12)/.18);state.unifilar=1-clamp((p-.13)/.17);state.iso=clamp((p-.43)/.22);state.racks=clamp((p-.44)/.2);state.systems=clamp((p-.61)/.2);state.build=clamp((p-.73)/.18);state.roof=clamp((p-.88)/.1);update();draw()}
const ND_PARADAS=[0,.292,.584,.858];
function navigate(i){const ratios=ND_PARADAS;if(reduced||!scrollTrigger){fallbackAt(ratios[i]);return}const y=scrollTrigger.start+(scrollTrigger.end-scrollTrigger.start)*ratios[i];if(typeof ln!=='undefined'&&ln)ln.scrollTo(y,{duration:1.4});else window.scrollTo({top:y,behavior:'smooth'});}
$$('.nd-phase').forEach(el=>el.addEventListener('click',()=>navigate(Number(el.dataset.phase))));
$$('.nd-system').forEach(el=>el.addEventListener('click',()=>{const key=el.dataset.system;visible[key]=!visible[key];el.setAttribute('aria-pressed',String(visible[key]));needsDraw=true;draw()}));
const report=document.getElementById('nd-report');
document.getElementById('nd-notes').innerHTML=electrical.notes.map(n=>'<li>'+n+'</li>').join('');
document.getElementById('nd-table').innerHTML=electrical.nodes.map(n=>'<tr><td>'+n.id+'</td><td>'+n.label+'</td><td>'+(electrical.edges.filter(e=>e.to===n.id).map(e=>e.from+(e.mode==='standby'?' (reserva)':'')).join(' / ')||'Origen externo')+'</td></tr>').join('');
function renderElectricalReport(){const cv=document.getElementById('nd-report-canvas'),old=c,oldState={...state};cv.width=1290;cv.height=930;c=cv.getContext('2d');c.clearRect(0,0,1290,930);c.translate(645,445);c.scale(1.45,1.45);Object.assign(state,{unifilar:1,plan:0,iso:0});circuit();Object.assign(state,oldState);c=old;}
document.getElementById('nd-open').addEventListener('click',()=>{report.showModal();renderElectricalReport()});
document.getElementById('nd-close').addEventListener('click',()=>report.close());
setPhase(0);resize();window.addEventListener('resize',resize);new ResizeObserver(resize).observe(canvas);
/* El pin. Mismo guion que el original, pero con el GSAP y el scroll suave del
   sitio (el original traía su propio GSAP 3.13 embebido) y más corto: cinco
   pantallas en vez de seis.
   `refreshPriority:2` — este pin mete miles de píxeles de espaciador muy arriba
   en la página. Si se refrescara después que los disparadores de más abajo,
   todos calcularían su posición sin contarlo y quedarían corridos (ya pasó con
   el pin de servicios, que lleva prioridad 1). */
/* Cuatro fases, cuatro gestos. Con 5,8 pantallas de recorrido el cliente
   sentia que habia que scrollear mucho y que no avanzaba. Ahora son 3,6, y en
   computador el scroll tiene iman: cada gesto de rueda o trackpad termina
   exactamente en la fase siguiente. Las paradas son el reposo de cada fase
   en la linea de tiempo (0, 3,4, 6,8 y 10 de 11,65 tiempos) y la ultima, 1,
   es la salida hacia la seccion siguiente. En tactil NO hay iman: pelea con
   la inercia del dedo y da la sensacion de que la pagina se atasca. */
const ND_TACTIL=matchMedia('(hover:none),(pointer:coarse)').matches;
if(window.gsap&&window.ScrollTrigger&&!reduced){
 const tl=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:root,pin:$('.nd-vp'),start:'top top',
  end:()=>'+='+Math.max(innerHeight*3.6,2600),scrub:.8,invalidateOnRefresh:true,anticipatePin:1,refreshPriority:2,
  snap:ND_TACTIL?false:{snapTo:ND_PARADAS.concat(1),duration:{min:.35,max:.8},delay:.08,ease:'power2.inOut',directional:true}},onUpdate:update});
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
function tick(ms){requestAnimationFrame(tick);if(document.hidden||!enVista||ms-last<32)return;t=ms/1000;last=ms;if(needsDraw||(!reduced&&(state.unifilar>.01||state.systems>.01))){draw();needsDraw=false}}requestAnimationFrame(tick);
})();
