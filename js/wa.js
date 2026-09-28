/* ============================================================
   WHATSAPP · el formulario y el asistente
   ------------------------------------------------------------
   No hay servidor detrás: la solicitud se redacta aquí y se abre WhatsApp con
   el texto ya escrito, para que el cliente solo pulse enviar. Dos entradas a lo
   mismo:

     · el formulario de contacto, que compone el mensaje con lo que se llenó;
     · el botón flotante, que abre un asistente corto —una pregunta cada vez— y
       termina en el mismo mensaje.

   El texto se arma en un solo sitio (`redactar`) para que las dos vías manden
   exactamente lo mismo y no haya dos formatos rondando.
   ============================================================ */
(function () {
  'use strict';

  /* El número de Proyectos, que es el que atiende solicitudes técnicas. Para
     cambiarlo, aquí: lo usan las dos vías. */
  var NUMERO = '573154788369';

  /* ---------- el texto ---------- */
  function redactar(d) {
    var l = [];
    l.push('Buen día, DATCER.');
    l.push('');
    var quien = 'Mi nombre es ' + d.nombre;
    if (d.empresa) quien += ' y escribo de parte de ' + d.empresa;
    if (d.cargo) quien += ' (' + d.cargo + ')';
    l.push(quien + '.');
    l.push('');
    if (d.servicio) l.push('*Servicio requerido:* ' + d.servicio);
    if (d.proyecto) l.push('*El proyecto:* ' + d.proyecto);
    if (d.correo) l.push('*Correo de contacto:* ' + d.correo);
    l.push('');
    l.push('Quedo atento a su respuesta. Gracias.');
    return l.join('\n');
  }

  function abrir(texto) {
    window.open('https://wa.me/' + NUMERO + '?text=' + encodeURIComponent(texto), '_blank', 'noopener');
  }

  /* ---------- 1. el formulario ---------- */
  var fm = document.getElementById('fm');
  if (fm) {
    /* El aviso va antes del botón: hay que saber a dónde va la solicitud ANTES
       de pulsar, no después. */
    var pie = fm.querySelector('.fend');
    if (pie && !fm.querySelector('.wa-aviso')) {
      var aviso = document.createElement('p');
      aviso.className = 'wa-aviso';
      aviso.innerHTML = '<i aria-hidden="true"></i><span>Su solicitud se enviar&aacute; por nuestro <b>WhatsApp empresarial</b> para agilizar el proceso. Al enviar se abre el chat con el mensaje ya redactado.</span>';
      pie.parentNode.insertBefore(aviso, pie);
    }

    fm.addEventListener('wa:enviar', function () {
      var v = function (id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; };
      abrir(redactar({
        nombre:   v('a1'),
        empresa:  v('a2'),
        cargo:    v('a3'),
        correo:   v('a4'),
        servicio: v('a5'),
        proyecto: v('a6')
      }));
    });
  }

  /* ---------- 2. el botón flotante y su asistente ---------- */
  if (document.getElementById('wa')) return;

  /* El tono importa: esto habla en nombre de DATCER con un cliente que puede
     ser el gerente de una entidad financiera. Se trata de usted, se pide con
     cortesía y se agradece. */
  var PASOS = [
    {k:'nombre',   p:'¿Con quién tengo el gusto?', ph:'Nombre y apellido', obl:true,
     eco:function(v){ return 'Un gusto, ' + pila(v) + '.'; }},
    {k:'empresa',  p:'¿De qué empresa nos escribe?', ph:'Nombre de la empresa', obl:true,
     eco:function(v){ return 'Gracias. Tomo nota de ' + v + '.'; }},
    {k:'cargo',    p:'¿Cuál es su cargo? Si lo prefiere, puede omitirlo.', ph:'Cargo (opcional)',
     eco:function(v){ return v ? 'Perfecto, anotado.' : 'Sin problema, seguimos.'; }},
    {k:'correo',   p:'¿A qué correo podemos responderle?', ph:'nombre@empresa.com', obl:true, tipo:'email',
     eco:function(v){ return 'Listo, le respondemos a ' + v + '.'; }},
    {k:'servicio', p:'¿En qué servicio podemos ayudarle?', ph:'Diseño, shelter, comisionamiento…', obl:true,
     eco:function(v, d){ return 'Entendido, ' + pila(d.nombre) + ': ' + v + '.'; }},
    {k:'proyecto', p:'Por último, cuéntenos brevemente de su proyecto.', ph:'Dónde está, qué carga y en qué etapa va', obl:true, largo:true}
  ];

  /* El nombre de pila, con su mayúscula: la gente escribe «sebas» o «SEBASTIÁN»
     y contestarle con eso tal cual se lee mal. */
  function pila(n){
    var x = String(n || '').trim().split(/\s+/)[0] || '';
    return x.charAt(0).toUpperCase() + x.slice(1).toLowerCase();
  }

  var caja = document.createElement('div');
  caja.id = 'wa';
  caja.innerHTML =
    '<div class="wa-pan" role="dialog" aria-label="Asistente de solicitud" aria-hidden="true">' +
      '<div class="wa-top">' +
        '<span class="wa-id"><i></i><b>DATCER</b><small>Responde en horario hábil</small></span>' +
        '<button class="wa-x" type="button" aria-label="Cerrar">&times;</button>' +
      '</div>' +
      '<div class="wa-msgs"></div>' +
      '<form class="wa-in"><input type="text" autocomplete="off" aria-label="Su respuesta"><button type="submit" aria-label="Continuar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 12h15M13 6l6 6-6 6"/></svg></button></form>' +
    '</div>' +
    '<button class="wa-bt" type="button" aria-label="Escribir por WhatsApp">' +
      '<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16 3.2c-7 0-12.7 5.7-12.7 12.7 0 2.2.6 4.4 1.7 6.3L3.2 28.8l6.8-1.8c1.8 1 3.9 1.5 6 1.5 7 0 12.7-5.7 12.7-12.7S23 3.2 16 3.2zm0 23.1c-1.9 0-3.8-.5-5.4-1.5l-.4-.2-4 1.1 1.1-3.9-.3-.4c-1.1-1.7-1.6-3.6-1.6-5.6 0-5.8 4.7-10.5 10.5-10.5S26.5 10 26.5 15.8 21.8 26.3 16 26.3zm5.8-7.8c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2s-.8 1-1 1.2c-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.2-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.6l-1-2.3c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.8s1.2 3.3 1.4 3.5c.2.2 2.4 3.7 5.9 5.2.8.4 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 2.1-.9 2.4-1.7.3-.8.3-1.5.2-1.7-.1-.1-.3-.2-.6-.3z"/></svg>' +
      '<span class="wa-pt"></span>' +
    '</button>';
  document.body.appendChild(caja);

  var pan   = caja.querySelector('.wa-pan'),
      bt    = caja.querySelector('.wa-bt'),
      cerrar= caja.querySelector('.wa-x'),
      msgs  = caja.querySelector('.wa-msgs'),
      form  = caja.querySelector('.wa-in'),
      campo = form.querySelector('input');

  var datos = {}, i = 0, abierto = false;

  function burbuja(texto, mia) {
    var b = document.createElement('div');
    b.className = 'wa-m' + (mia ? ' yo' : '');
    b.textContent = texto;
    msgs.appendChild(b);
    msgs.scrollTop = msgs.scrollHeight;
    return b;
  }

  /* el "escribiendo…" antes de cada pregunta: sin él las respuestas del
     asistente aparecen de golpe y no se leen como una conversación */
  /* «escribiendo…» y luego el texto: sin esa pausa las respuestas aparecen de
     golpe y no se leen como una conversación */
  function decir(texto, luego, espera) {
    var esperando = burbuja('•••');
    esperando.classList.add('wa-esp');
    setTimeout(function () {
      esperando.classList.remove('wa-esp');
      esperando.textContent = texto;
      msgs.scrollTop = msgs.scrollHeight;
      if (luego) luego();
    }, espera || 520);
  }

  function preguntar() {
    if (i >= PASOS.length) return cerrarConversacion();
    var paso = PASOS[i];
    decir(paso.p, function () {
      campo.placeholder = paso.ph || '';
      campo.type = paso.tipo || 'text';
      campo.disabled = false;
      campo.focus();
    });
  }

  function cerrarConversacion() {
    campo.disabled = true;
    campo.placeholder = '';
    decir('Muchas gracias, ' + pila(datos.nombre) + '. Su solicitud queda redactada: al abrir WhatsApp solo tendrá que pulsar enviar y un ingeniero le responderá.', function () {
      var b = document.createElement('button');
      b.className = 'wa-go';
      b.type = 'button';
      b.textContent = 'Abrir WhatsApp y enviar';
      b.addEventListener('click', function () { abrir(redactar(datos)); });
      msgs.appendChild(b);
      msgs.scrollTop = msgs.scrollHeight;
    }, 600);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var paso = PASOS[i], val = campo.value.trim();
    if (paso.obl && !val) { campo.focus(); return; }
    if (val) burbuja(val, true);
    datos[paso.k] = val;
    campo.value = '';
    campo.disabled = true;
    if (paso.eco) decir(paso.eco(val, datos), function () { i++; preguntar(); }, 420);
    else { i++; preguntar(); }
  });

  function abrirPanel(si) {
    abierto = si;
    caja.classList.toggle('on', si);
    pan.setAttribute('aria-hidden', si ? 'false' : 'true');
    if (si && !msgs.children.length) {
      burbuja('Buen día, bienvenido a DATCER. Con gusto tomo sus datos para preparar la solicitud y enviarla por WhatsApp. Son solo unas preguntas.');
      preguntar();
    }
  }
  bt.addEventListener('click', function () { abrirPanel(!abierto); });
  cerrar.addEventListener('click', function () { abrirPanel(false); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && abierto) abrirPanel(false); });
})();
