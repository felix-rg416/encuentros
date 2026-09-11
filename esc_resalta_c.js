// ============================================================
// PLANTILLA REUTILIZABLE - "resalta una categoría"
// ============================================================

let esc_resalta_c = {
  usaGiro: false,

  FILTRO: function (fila) {
    return fila[0] === "c";
  },

  TEXTO_1: "Saludo\nfísico",
  TEXTO_2: "",

  TEXTO_1_X: 0.10,
  TEXTO_1_Y: 0.03,

  TEXTO_2_X: 0.85,
  TEXTO_2_Y: 0.9,

  TEXTO_TAMANO: 0.04,
  TEXTO_FUENTE: "Helvetica",
  TEXTO_COLOR: [0, 0, 0],
  TEXTO_BORDE_COLOR: [255, 255, 255],
  TEXTO_BORDE_GROSOR: 0,
  TEXTO_INTERLINEA: 0.04,
  PIXEL_INICIO: 24,
  PIXEL_FIN: 1,

  OPACIDAD_RESALTE: 255,
  OPACIDAD_OTROS: 5,

  DURACION_FIGURAS: 200,
  DURACION_OTROS: 150,
  DURACION_IMAGEN: 70,

  DURACION_PAUSA_MEDIO: 50,

  DURACION_FIGURAS_REVERSA: 200,
  DURACION_OTROS_REVERSA: 150,
  DURACION_IMAGEN_REVERSA: 100,

  duracion: 0,
  FASE1_LARGO: 0,
  FASE2_LARGO: 0,

  frameInicioEscena: 0,
  puntosResaltados: [],

  iniciar: function (puntos, tamanoModulo) {
    this.frameInicioEscena = reloj;

    this.FASE1_LARGO = max(this.DURACION_FIGURAS, this.DURACION_OTROS, this.DURACION_IMAGEN);
    this.FASE2_LARGO = max(this.DURACION_FIGURAS_REVERSA, this.DURACION_OTROS_REVERSA, this.DURACION_IMAGEN_REVERSA);
    this.duracion = this.FASE1_LARGO + this.DURACION_PAUSA_MEDIO + this.FASE2_LARGO;

    this.puntosResaltados = puntos
      .filter(p => this.FILTRO(datos[p.datosIndex]))
      .sort((a, b) => a.datosIndex - b.datosIndex);

    let total = this.puntosResaltados.length;

    let ventana1 = this.DURACION_FIGURAS / total;
    for (let i = 0; i < total; i++) {
      let p = this.puntosResaltados[i];
      p._f1Inicio = i * ventana1;
      p._f1Fin = p._f1Inicio + ventana1;
    }

    let inicioFase2 = this.FASE1_LARGO + this.DURACION_PAUSA_MEDIO;
    let ventana2 = this.DURACION_FIGURAS_REVERSA / total;
    for (let i = 0; i < total; i++) {
      let p = this.puntosResaltados[i];
      p._f2Inicio = inicioFase2 + (i * ventana2);
      p._f2Fin = p._f2Inicio + ventana2;
    }
  },

  dibujar: function (puntos, tamanoModulo) {
    imageMode(CENTER);

    let framesTranscurridos = reloj - this.frameInicioEscena;
    let inicioFase2 = this.FASE1_LARGO + this.DURACION_PAUSA_MEDIO;
    let enFase2 = framesTranscurridos >= inicioFase2;

    for (let p of puntos) {
      let esResaltado = this.FILTRO(datos[p.datosIndex]);
      let opacidad;

      if (esResaltado) {
        if (!enFase2) {
          opacidad = map(framesTranscurridos, p._f1Inicio, p._f1Fin, OPACIDAD, this.OPACIDAD_RESALTE, true);
        } else {
          opacidad = map(framesTranscurridos, p._f2Inicio, p._f2Fin, this.OPACIDAD_RESALTE, OPACIDAD, true);
        }
      } else {
        if (!enFase2) {
          let t1 = constrain(framesTranscurridos / this.DURACION_OTROS, 0, 1);
          opacidad = lerp(OPACIDAD, this.OPACIDAD_OTROS, t1);
        } else {
          let framesFase2 = framesTranscurridos - inicioFase2;
          let t2 = constrain(framesFase2 / this.DURACION_OTROS_REVERSA, 0, 1);
          opacidad = lerp(this.OPACIDAD_OTROS, OPACIDAD, t2);
        }
      }

      tint(255, opacidad);
      image(p.img, p.x, p.y, p.tamano, p.tamano);
    }

    tint(255, 255);

    let pixelSize, opacidadTexto;

    if (!enFase2) {
      let t1 = constrain(framesTranscurridos / this.DURACION_IMAGEN, 0, 1);
      let tSuave1 = 1 - pow(1 - t1, 3);
      pixelSize = round(lerp(this.PIXEL_INICIO, this.PIXEL_FIN, tSuave1));
      opacidadTexto = 255;
    } else {
      let framesFase2 = framesTranscurridos - inicioFase2;
      let t2 = constrain(framesFase2 / this.DURACION_IMAGEN_REVERSA, 0, 1);
      let tSuave2 = pow(t2, 3);
      pixelSize = round(lerp(this.PIXEL_FIN, this.PIXEL_INICIO, tSuave2));
      opacidadTexto = lerp(255, 0, tSuave2);
    }

    let bufferW = max(1, floor(width / pixelSize));
    let bufferH = max(1, floor(height / pixelSize));

    let bufferChico = createGraphics(bufferW, bufferH);
    bufferChico.background(0, 0);
    bufferChico.textFont(this.TEXTO_FUENTE);
    bufferChico.textAlign(CENTER, TOP);
    bufferChico.textSize((width * this.TEXTO_TAMANO) / pixelSize);
    bufferChico.textLeading((width * this.TEXTO_INTERLINEA) / pixelSize);
    bufferChico.stroke(this.TEXTO_BORDE_COLOR[0], this.TEXTO_BORDE_COLOR[1], this.TEXTO_BORDE_COLOR[2]);
    bufferChico.strokeWeight(this.TEXTO_BORDE_GROSOR / pixelSize);
    bufferChico.fill(this.TEXTO_COLOR[0], this.TEXTO_COLOR[1], this.TEXTO_COLOR[2]);
    bufferChico.text(this.TEXTO_1, (width * this.TEXTO_1_X) / pixelSize, (height * this.TEXTO_1_Y) / pixelSize);
    bufferChico.text(this.TEXTO_2, (width * this.TEXTO_2_X) / pixelSize, (height * this.TEXTO_2_Y) / pixelSize);

    push();
    noSmooth();
    imageMode(CORNER);
    tint(255, opacidadTexto);
    image(bufferChico, 0, 0, width, height);
    pop();

    bufferChico.remove();
  }
};