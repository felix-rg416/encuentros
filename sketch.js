const COLOR_FONDO = "#fffff0";

let estoyGrabando = false;
let mediaRecorder = null;
let chunksGrabados = [];

let imagenes = [];
let puntosGlobales = [];

let elementoScrubber;

const FRACCION_TAMANO_MAXIMO = 0.125;
const FRACCION_TAMANO_MINIMO = 0.030;
const CANTIDAD_REFERENCIA = 150;
let TAMANO_MODULO;

const GIRO = {
  1: { velocidad: 0.015, direccion: 1 },
  2: { velocidad: 0.015, direccion: -1 },
  3: { velocidad: 0.015, direccion: 1 }
};

let escenas = [
  esc_elipses,
  esc_anillo,
  crearEscenaPausa(60, esc_anillo),
  esc_atomo,
  esc_atomo_texto,
  crearEscenaPausa(60, esc_atomo_texto),
  esc_explosion_2,
  crearEscenaPausa(50, esc_explosion_2),
  esc_resalta_x,
  crearEscenaPausa(50, esc_resalta_x),
  esc_resalta_c,
  crearEscenaPausa(50, esc_resalta_c),
  // esc_tipo_saludo,
  // crearEscenaPausa(50, esc_tipo_saludo),
  esc_quien_inicia,
  crearEscenaPausa(60, esc_quien_inicia),
  esc_texto,
  crearEscenaPausa(90, esc_texto),
  esc_explosion_2,
  crearEscenaPausa(70, esc_explosion_2),
  // esc_resalta_c_rojo,
  // crearEscenaPausa(50, esc_resalta_c_rojo),
  esc_final_2,
];

// --- Reloj propio: reemplaza el uso de frameCount de p5.js en todas las escenas ---
let reloj = 0;
let reproduciendo = true;
let escenaActual = 0;
let frameEscenaInicio = 0;

// --- Para el scrubber ---
let duracionTotal = 0;
let arrastrandoScrubber = false;

async function setup() {
  let miCanvas = createCanvas(800, 800);
  miCanvas.parent('p5-container');
  miCanvas.style('display', 'block');

  conectarBotones();

  TAMANO_MODULO = map(datos.length, 1, CANTIDAD_REFERENCIA, width * FRACCION_TAMANO_MAXIMO, width * FRACCION_TAMANO_MINIMO, true);

  let nombresUnicos = [...new Set(datos.map(fila => {
    let [forma, color, punto, contorno] = fila;
    return `modulos/-_${forma}-${color}-${punto}-${contorno}.png`;
  }))];

  let imagenesCargadas = await Promise.all(
    nombresUnicos.map(nombre => loadImage(nombre))
  );

  let mapaImagenes = {};
  for (let i = 0; i < nombresUnicos.length; i++) {
    mapaImagenes[nombresUnicos[i]] = imagenesCargadas[i];
  }

  for (let fila of datos) {
    let [forma, color, punto, contorno] = fila;
    let nombreArchivo = `modulos/-_${forma}-${color}-${punto}-${contorno}.png`;
    imagenes.push(mapaImagenes[nombreArchivo]);
  }

  let indicesPorCategoria = { 1: [], 2: [], 3: [] };
  for (let i = 0; i < datos.length; i++) {
    indicesPorCategoria[datos[i][3]].push(i);
  }

  for (let contorno in indicesPorCategoria) {
    let indices = indicesPorCategoria[contorno];
    let total = indices.length;
    for (let j = 0; j < total; j++) {
      let idx = indices[j];
      let anguloInicial = map(j, 0, total, 0, TWO_PI);
      puntosGlobales.push({
        img: imagenes[idx],
        contorno: Number(contorno),
        color: datos[idx][1],
        datosIndex: idx,
        angulo: anguloInicial,
        anguloInicial: anguloInicial, // <- guardamos el ángulo base, para poder resetear al buscar (seek)
        x: 0,
        y: 0
      });
    }
  }

  // --- Pasada de "priming": calculamos la duración real de cada escena para el scrubber ---
  let cursor = 0;
  for (let escena of escenas) {
    escena.iniciar(puntosGlobales, TAMANO_MODULO);
    cursor += escena.duracion;
  }
  duracionTotal = cursor;
  elementoScrubber = document.getElementById('scrubber');
  elementoScrubber.max = duracionTotal - 1;

  // Reseteamos todo para arrancar la reproducción real desde cero
  for (let p of puntosGlobales) {
    p.angulo = p.anguloInicial;
    p.x = 0;
    p.y = 0;
  }
  reloj = 0;
  escenaActual = 0;
  frameEscenaInicio = 0;
  escenas[escenaActual].iniciar(puntosGlobales, TAMANO_MODULO);
}

function draw() {

  background(COLOR_FONDO);

  if (reproduciendo) {
    avanzarUnFrame();
  }

  escenas[escenaActual].dibujar(puntosGlobales, TAMANO_MODULO);

  if (estoyGrabando) {
    // (la grabación ya funciona con MediaRecorder, sin cambios)
  }

  if (!arrastrandoScrubber) {
    elementoScrubber.value = reloj;
  }
}

function avanzarUnFrame() {
  if (escenas[escenaActual].usaGiro) {
    for (let p of puntosGlobales) {
      let giro = GIRO[p.contorno];
      p.angulo += giro.velocidad * giro.direccion;
    }
  }

  reloj++;

  let escena = escenas[escenaActual];
  let framesTranscurridos = reloj - frameEscenaInicio;

  if (framesTranscurridos >= escena.duracion) {
    escenaActual = (escenaActual + 1) % escenas.length;
    frameEscenaInicio = reloj;
    if (escenaActual === 0) reloj = 0, frameEscenaInicio = 0; // loop: si vuelve a la primera, reinicia el reloj
    escenas[escenaActual].iniciar(puntosGlobales, TAMANO_MODULO);
  }
}

// --- Salta a un frame exacto del "reloj" global, recalculando todo el camino desde el inicio ---
function seekTo(frameObjetivo) {
  frameObjetivo = constrain(floor(frameObjetivo), 0, duracionTotal - 1);

  for (let p of puntosGlobales) {
    p.angulo = p.anguloInicial;
    p.x = 0;
    p.y = 0;
  }

  let cursor = 0;
  let indiceEscena = 0;

  for (let i = 0; i < escenas.length; i++) {
    let escena = escenas[i];

    if (cursor + escena.duracion <= frameObjetivo) {
      // Esta escena ya se completó por entero antes del frame buscado: la "recorremos" entera
      reloj = cursor;
      escena.iniciar(puntosGlobales, TAMANO_MODULO);

      if (escena.usaGiro) {
        for (let p of puntosGlobales) {
          let giro = GIRO[p.contorno];
          p.angulo += giro.velocidad * giro.direccion * escena.duracion;
        }
      }

      reloj = cursor + escena.duracion;
      escena.dibujar(puntosGlobales, TAMANO_MODULO); // fija x/y finales para la siguiente escena

      cursor += escena.duracion;
    } else {
      indiceEscena = i;
      break;
    }
  }

  let escenaObjetivo = escenas[indiceEscena];
  let framesDentro = frameObjetivo - cursor;

  if (escenaObjetivo.usaGiro) {
    for (let p of puntosGlobales) {
      let giro = GIRO[p.contorno];
      p.angulo += giro.velocidad * giro.direccion * framesDentro;
    }
  }

  reloj = cursor;
  escenaObjetivo.iniciar(puntosGlobales, TAMANO_MODULO);
  reloj = frameObjetivo;

  escenaActual = indiceEscena;
  frameEscenaInicio = cursor;
}

function iniciarGrabacion() {
  if (estoyGrabando) return;

  let stream = document.querySelector('#p5-container canvas').captureStream(30);
  chunksGrabados = [];

  mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

  mediaRecorder.ondataavailable = function (evento) {
    if (evento.data.size > 0) chunksGrabados.push(evento.data);
  };

  mediaRecorder.onstop = function () {
    let blob = new Blob(chunksGrabados, { type: 'video/webm' });
    let url = URL.createObjectURL(blob);
    let enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = 'animacion-saludos.webm';
    enlace.click();
    URL.revokeObjectURL(url);
  };

  mediaRecorder.start();
  estoyGrabando = true;
}

function detenerGrabacion() {
  if (!estoyGrabando) return;
  mediaRecorder.stop();
  estoyGrabando = false;
}

function conectarBotones() {
  let btnGrabar = document.getElementById('btn-grabar');
  let btnDetener = document.getElementById('btn-detener');
  let btnPlayPausa = document.getElementById('btn-play-pausa');
  let scrubber = document.getElementById('scrubber');

  btnGrabar.addEventListener('click', function () {
    iniciarGrabacion();
    btnGrabar.disabled = true;
    btnGrabar.classList.add('activo');
    btnDetener.disabled = false;
  });

  btnDetener.addEventListener('click', function () {
    detenerGrabacion();
    btnGrabar.disabled = false;
    btnGrabar.classList.remove('activo');
    btnDetener.disabled = true;
  });

  btnPlayPausa.addEventListener('click', function () {
    reproduciendo = !reproduciendo;
    btnPlayPausa.textContent = reproduciendo ? 'Pausar' : 'Reanudar';
  });

  scrubber.addEventListener('mousedown', function () { arrastrandoScrubber = true; });
  scrubber.addEventListener('touchstart', function () { arrastrandoScrubber = true; });

  scrubber.addEventListener('input', function () {
    reproduciendo = false;
    btnPlayPausa.textContent = 'Reanudar';
    seekTo(Number(scrubber.value));
  });

  scrubber.addEventListener('mouseup', function () { arrastrandoScrubber = false; });
  scrubber.addEventListener('touchend', function () { arrastrandoScrubber = false; });
}

function crearDataset() {
  return datos;
}