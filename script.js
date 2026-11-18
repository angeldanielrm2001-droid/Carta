/* =========================================================================
  CARTA ROMÁNTICA · interacción
  No necesitas editar este archivo: las fotos y el texto de la carta
  se personalizan en index.html.
   ========================================================================= */
(() => {
  'use strict';

  /* ---------- Referencias ---------- */
  const $ = (selector) => document.querySelector(selector);

  const zona        = $('#sobre-zona');
  const sello       = $('#sello');
  const cartaSobre  = $('#carta-sobre');
  const modal       = $('#modal');
  const papel       = $('#papel');
  const contenido   = $('#papel-contenido');
  const botonCerrar = $('#cerrar');
  const contenedorCorazones = $('#corazones');

  const reducirMovimiento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const aleatorio = (min, max) => Math.random() * (max - min) + min;

  /* Estados: 'cerrado' → 'abriendo' → 'listo' ⇄ 'leyendo' */
  let estado = 'cerrado';
  let temporizadorLimpieza = null;
  let elementoPrevio = null;


  /* ---------- Corazones decorativos del fondo ---------- */
  const PALETA = ['#fbd3dd', '#f8bccb', '#f4a3b8', '#ee86a0', '#e8647f', '#dc4663', '#cf3350', '#c1273f'];
  let anchoPrevio = 0;
  let altoPrevio = 0;

  function dibujarCorazones() {
    const ancho = window.innerWidth;
    const alto = window.innerHeight;
    const paso = ancho < 600 ? 78 : 104;           // separación aproximada
    const columnas = Math.ceil(ancho / paso);
    const filas = Math.ceil(alto / paso);
    const fragmento = document.createDocumentFragment();

    for (let f = 0; f < filas; f++) {
      for (let c = 0; c < columnas; c++) {
        if (Math.random() > 0.72) continue;         // deja huecos para que respire

        const tamano = aleatorio(10, 26);
        const corazon = document.createElement('span');
        corazon.className = 'corazon';
        corazon.style.width = corazon.style.height = `${tamano}px`;
        corazon.style.left = `${(c + aleatorio(0.1, 0.9)) * paso - tamano / 2}px`;
        corazon.style.top = `${(f + aleatorio(0.1, 0.9)) * paso - tamano / 2}px`;
        corazon.style.backgroundColor = PALETA[Math.floor(Math.random() * PALETA.length)];
        corazon.style.opacity = aleatorio(0.55, 0.95).toFixed(2);
        corazon.style.setProperty('--giro', `${aleatorio(-30, 30).toFixed(0)}deg`);
        corazon.style.setProperty('--dur', `${aleatorio(5, 9).toFixed(1)}s`);
        corazon.style.setProperty('--retraso', `-${aleatorio(0, 6).toFixed(1)}s`);
        fragmento.appendChild(corazon);
      }
    }

    contenedorCorazones.replaceChildren(fragmento);
    anchoPrevio = ancho;
    altoPrevio = alto;
  }

  let temporizadorResize = null;
  window.addEventListener('resize', () => {
    clearTimeout(temporizadorResize);
    temporizadorResize = setTimeout(() => {
      // Evita regenerar por el vaivén de la barra del navegador en móviles
      const cambioAncho = window.innerWidth !== anchoPrevio;
      const cambioAlto = Math.abs(window.innerHeight - altoPrevio) > 150;
      if (cambioAncho || cambioAlto) dibujarCorazones();
    }, 250);
  });


  /* ---------- Abrir el sobre ---------- */
  function abrirSobre() {
    if (estado !== 'cerrado') return;
    estado = 'abriendo';

    zona.classList.add('abierto');       // gira la solapa y sube la carta
    sello.disabled = true;

    // Cuando la carta termina de salir, se abre la ventana emergente
    setTimeout(() => {
      zona.classList.add('listo');
      cartaSobre.disabled = false;
      abrirCarta();
    }, reducirMovimiento() ? 250 : 1700);
  }


  /* ---------- Mostrar la carta (la ventana crece desde la carta) ---------- */
  function abrirCarta() {
    if (estado === 'leyendo') return;
    estado = 'leyendo';
    clearTimeout(temporizadorLimpieza);

    elementoPrevio = document.activeElement;
    const origen = cartaSobre.getBoundingClientRect();

    document.documentElement.classList.add('sin-scroll');
    modal.hidden = false;
    contenido.scrollTop = 0;

    // Medimos la posición final de la carta sin transformaciones
    papel.style.transition = 'none';
    papel.style.opacity = '1';
    papel.style.transform = 'none';
    const destino = papel.getBoundingClientRect();

    // Colocamos la ventana justo encima de la carta que asoma del sobre
    const escala = origen.width / destino.width;
    const dx = (origen.left + origen.width / 2) - (destino.left + destino.width / 2);
    const dy = origen.top - destino.top;
    papel.style.transformOrigin = '50% 0';
    papel.style.transform = `translate(${dx}px, ${dy}px) scale(${escala})`;

    zona.classList.add('leyendo');       // oculta la carta pequeña
    void papel.offsetWidth;              // fuerza el cálculo antes de animar

    // Y la dejamos crecer hasta el centro de la pantalla
    papel.style.transition = '';
    requestAnimationFrame(() => {
      modal.classList.add('visible');
      papel.style.transform = 'none';
    });

    temporizadorLimpieza = setTimeout(() => {
      papel.removeAttribute('style');
    }, 1100);

    setTimeout(() => botonCerrar.focus({ preventScroll: true }), 150);
  }


  /* ---------- Cerrar la carta ---------- */
  function cerrarCarta() {
    if (estado !== 'leyendo') return;
    clearTimeout(temporizadorLimpieza);
    papel.removeAttribute('style');
    modal.classList.remove('visible');

    setTimeout(() => {
      modal.hidden = true;
      zona.classList.remove('leyendo');   // la carta vuelve a asomar del sobre
      document.documentElement.classList.remove('sin-scroll');
      estado = 'listo';

      const destino = cartaSobre.disabled ? elementoPrevio : cartaSobre;
      if (destino && destino.focus) destino.focus({ preventScroll: true });
    }, reducirMovimiento() ? 50 : 600);
  }


  /* ---------- Eventos ---------- */
  sello.addEventListener('click', abrirSobre);

  cartaSobre.addEventListener('click', () => {
    if (estado === 'listo') abrirCarta();
  });

  modal.addEventListener('click', (evento) => {
    if (evento.target.closest('[data-cerrar]')) cerrarCarta();
  });

  document.addEventListener('keydown', (evento) => {
    if (estado !== 'leyendo') return;

    if (evento.key === 'Escape') {
      cerrarCarta();
      return;
    }

    // Mantiene el foco del teclado dentro de la ventana emergente
    if (evento.key === 'Tab') {
      const enfocables = [botonCerrar, contenido];
      const primero = enfocables[0];
      const ultimo = enfocables[enfocables.length - 1];
      const activo = document.activeElement;

      if (!enfocables.includes(activo)) {
        evento.preventDefault();
        primero.focus();
      } else if (evento.shiftKey && activo === primero) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && activo === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
    }
  });


  /* ---------- Inicio ---------- */
  dibujarCorazones();
})();
