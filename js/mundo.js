/* ============================================================
   EL VUELO DEL INICIO · configuracion de scroll-world
   ------------------------------------------------------------
   Seis escenas, de la fibra al edificio. Cada una es un clip arrastrado por
   el scroll; entre escena y escena el motor funde (no hay conectores
   generados: los clips son los que ya tenia el sitio, no se grabaron
   encadenados). Por eso el orden busca que cada final se parezca al
   siguiente principio: fibra -> fibra, pasillo -> pasillo, la puerta que se
   abre al blanco -> la sala blanca en montaje.

   scroll: pantallas de recorrido por escena. linger: la camara se calma a
   mitad de escena, justo cuando el texto esta en su punto.
   ============================================================ */
(function(){
  var raiz = document.getElementById('world');
  if (!raiz || typeof mountScrollWorld !== 'function') return;
  var V = '#8473D7';
  mountScrollWorld(raiz, {
    nav: false, atmosphere: false, hint: 'Despl\u00e1cese', crossfade: 0.32,
    diveScroll: 1.4,
    sections: [
      { id:'fibra', label:'Inicio', still:'assets/world/1-fibra.jpg', clip:'assets/world/1-fibra.mp4',
        accent:V, scroll:1.7, linger:.25,
        eyebrow:'DATCER \u00b7 Data Center Design & Consulting',
        title:'Dise\u00f1amos el lugar donde viven sus datos.',
        body:'Ingenier\u00eda de data center e infraestructura cr\u00edtica, de la primera conexi\u00f3n a la sala en operaci\u00f3n.',
        tags:['TIER I\u2013IV','TIA-942','Uptime Institute'] },
      { id:'conexion', label:'Conectividad', still:'assets/world/2-conexion.jpg', clip:'assets/world/2-conexion.mp4',
        accent:V, scroll:1.5, linger:.3,
        eyebrow:'Energ\u00eda y datos',
        title:'Miles de conexiones. Ninguna puede fallar.',
        body:'Dos rutas independientes para cada sistema: si una cae, la otra sostiene la operaci\u00f3n.',
        tags:['Redundancia 2N','Fibra \u00f3ptica','99,995 %'] },
      { id:'pasillo', label:'La sala', still:'assets/world/3-pasillo.jpg', clip:'assets/world/3-pasillo.mp4',
        accent:'#7FB0FF', scroll:1.4, linger:.3,
        eyebrow:'Dise\u00f1o de sala',
        title:'Cada rack, en su lugar.',
        body:'Pasillos fr\u00edos y calientes, cargas y capacidad calculados antes de instalar el primer gabinete.',
        tags:['ASHRAE','Contenci\u00f3n','Simulaci\u00f3n CFD'] },
      { id:'puerta', label:'Dise\u00f1o', still:'assets/world/4-puerta.jpg', clip:'assets/world/4-puerta.mp4',
        accent:'#A897F0', scroll:1.3, linger:.2,
        eyebrow:'Ingenier\u00eda de dise\u00f1o',
        title:'Del plano a la sala real.',
        body:'Todo se decide y se documenta en el dise\u00f1o, antes de que exista una sola pared.',
        tags:['Planos','Memorias de c\u00e1lculo','BIM'] },
      { id:'sala', label:'Construcci\u00f3n', still:'assets/world/5-sala.jpg', clip:'assets/world/5-sala.mp4',
        accent:'#A897F0', scroll:1.5, linger:.3,
        eyebrow:'Construcci\u00f3n y puesta en marcha',
        title:'Montada, probada y entregada.',
        body:'Supervisamos la obra y comisionamos cada sistema hasta la puesta en marcha.',
        tags:['Comisionamiento L1\u2013L5','Sala confinada','Shelters'] },
      { id:'obra', label:'Operaci\u00f3n', still:'assets/world/6-obra.jpg', clip:'assets/world/6-obra.mp4',
        accent:V, scroll:1.8, linger:.2,
        eyebrow:'Del primer pilar a la operaci\u00f3n',
        title:'Infraestructura que no puede fallar.',
        body:'Cu\u00e9ntenos su proyecto: la primera consulta no tiene costo.',
        tags:[],
        cta:{ primary:{label:'Solicitar consulta', href:'#contact'},
              secondary:{label:'Ver los 28 servicios', href:'servicios.html'} } }
    ],
    connectors: []
  });
})();
