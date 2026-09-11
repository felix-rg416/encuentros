let esc_atomo_texto = {
  usaGiro: true,

  LINEA_COLOR: [128, 128, 128],
  LINEA_GROSOR: 5,

  // Fracción (0 a 1) de dónde queda el codo entre el anclaje y el texto.
  // 0 = el codo queda pegado al anclaje, 1 = pegado al texto. 0.5 = a mitad de camino.
  CODO_FRACCION: 0.5,

  // Desplazamiento vertical del punto de conexión respecto al borde superior del texto
  // (para que la línea llegue a la altura media del texto, no a su borde superior)
  TEXTO_LINEA_OFFSET_Y: 0.014,
  TEXTO_LINEA_OFFSET_X: 0.02,

  TEXTO_FUENTE: "Helvetica",
  TEXTO_COLOR: [30, 30, 30],
  TEXTO_BORDE_COLOR: [30, 30, 30],
  TEXTO_BORDE_GROSOR: 0,
  TEXTO_TAMANO: 0.035,

  PIXEL_INICIO: 20,
  PIXEL_FIN: 1,

CATEGORIAS: [
  { contorno: 3, nombre: "Universidad", anguloBorde: -140, textoX: 0.73, textoY: 0.16, anclajeTexto: "inicio" },
  { contorno: 2, nombre: "Otros",       anguloBorde: -120,  textoX: 0.1, textoY: 0.08, anclajeTexto: "fin" },
  { contorno: 1, nombre: "Casa",        anguloBorde: 130,   textoX: 0.83, textoY: 0.82, anclajeTexto: "inicio" }
],

  DURACION_POR_CATEGORIA: 40,

  duracion: 0,
  frameInicioEscena: 0,

  iniciar: function(puntos, tamanoModulo) {
    this.frameInicioEscena = reloj;
    this.duracion = this.DURACION_POR_CATEGORIA * this.CATEGORIAS.length;
  },

  calcularAnclaje: function(cat) {
    let fin = esc_atomo.ESTADO_FIN[cat.contorno];
    let cx = width * fin.cx;
    let cy = height * fin.cy;
    let rx = width * fin.rx;
    let ry = height * fin.ry;
    let rot = radians(fin.rotacionGrados);

    let a = radians(cat.anguloBorde);
    let xLocal = cos(a) * rx;
    let yLocal = sin(a) * ry;

    let x = cx + (xLocal * cos(rot) - yLocal * sin(rot));
    let y = cy + (xLocal * sin(rot) + yLocal * cos(rot));

    return { x, y };
  },

  // Punto exacto donde la línea toca el texto, según si conecta al inicio o al final de la palabra
calcularPuntoTexto: function(cat, textoDestX, textoDestY, anchoTexto) {
  let offsetX = width * this.TEXTO_LINEA_OFFSET_X;
  let x;

  if (cat.anclajeTexto === "fin") {
    x = textoDestX + anchoTexto + offsetX; // se aleja hacia la derecha del final de la palabra
  } else {
    x = textoDestX - offsetX; // se aleja hacia la izquierda del inicio de la palabra
  }

  let y = textoDestY + (height * this.TEXTO_LINEA_OFFSET_Y);
  return { x, y };
},

  // Dibuja una polilínea (varios puntos seguidos) de forma progresiva según "t" (0 a 1)
  dibujarLineaProgresiva: function(puntos, t) {
    let distancias = [];
    let total = 0;
    for (let i = 0; i < puntos.length - 1; i++) {
      let d = dist(puntos[i].x, puntos[i].y, puntos[i + 1].x, puntos[i + 1].y);
      distancias.push(d);
      total += d;
    }

    let distanciaObjetivo = total * t;
    let acumulado = 0;

    for (let i = 0; i < distancias.length; i++) {
      if (acumulado + distancias[i] >= distanciaObjetivo) {
        let restante = distanciaObjetivo - acumulado;
        let frac = distancias[i] === 0 ? 0 : restante / distancias[i];
        let x = lerp(puntos[i].x, puntos[i + 1].x, frac);
        let y = lerp(puntos[i].y, puntos[i + 1].y, frac);

        beginShape();
        noFill();
        for (let j = 0; j <= i; j++) vertex(puntos[j].x, puntos[j].y);
        vertex(x, y);
        endShape();
        return;
      }
      acumulado += distancias[i];
    }

    // t llegó a 1: dibuja la polilínea completa
    beginShape();
    noFill();
    for (let p of puntos) vertex(p.x, p.y);
    endShape();
  },

  dibujar: function(puntos, tamanoModulo) {
    esc_atomo.dibujar(puntos, tamanoModulo);

    let framesTranscurridos = reloj - this.frameInicioEscena;
    let indiceActual = floor(framesTranscurridos / this.DURACION_POR_CATEGORIA);

    for (let i = 0; i < this.CATEGORIAS.length; i++) {
      if (i > indiceActual) continue;

      let cat = this.CATEGORIAS[i];
      let framesLocal = framesTranscurridos - (i * this.DURACION_POR_CATEGORIA);
      let t = constrain(framesLocal / this.DURACION_POR_CATEGORIA, 0, 1);
      let tSuave = 1 - pow(1 - t, 3);

      let anclaje = this.calcularAnclaje(cat);
      let textoDestX = width * cat.textoX;
      let textoDestY = height * cat.textoY;

      // Medimos el ancho real del texto (a tamaño completo) para saber dónde termina la palabra
      push();
      textFont(this.TEXTO_FUENTE);
      textSize(width * this.TEXTO_TAMANO);
      let anchoTexto = textWidth(cat.nombre);
      pop();

      let puntoTexto = this.calcularPuntoTexto(cat, textoDestX, textoDestY, anchoTexto);

      // El codo queda entre el anclaje y el texto, a la altura del texto (línea diagonal + horizontal)
      let fraccionCodo = (cat.codoFraccion !== undefined) ? cat.codoFraccion : this.CODO_FRACCION;
      let codo = {
        x: lerp(anclaje.x, puntoTexto.x, fraccionCodo),
        y: puntoTexto.y
      };

      // --- Línea con codo, dibujada progresivamente ---
      push();
      stroke(this.LINEA_COLOR[0], this.LINEA_COLOR[1], this.LINEA_COLOR[2]);
      strokeWeight(this.LINEA_GROSOR);
      this.dibujarLineaProgresiva([anclaje, codo, puntoTexto], tSuave);
      pop();

      // --- Texto con efecto pixelado ---
      let pixelSize = round(lerp(this.PIXEL_INICIO, this.PIXEL_FIN, tSuave));
      let bufferW = max(1, floor(width / pixelSize));
      let bufferH = max(1, floor(height / pixelSize));

      let bufferChico = createGraphics(bufferW, bufferH);
      bufferChico.background(0, 0);
      bufferChico.textFont(this.TEXTO_FUENTE);
      bufferChico.textAlign(LEFT, TOP);
      bufferChico.textSize((width * this.TEXTO_TAMANO) / pixelSize);
      bufferChico.stroke(this.TEXTO_BORDE_COLOR[0], this.TEXTO_BORDE_COLOR[1], this.TEXTO_BORDE_COLOR[2]);
      bufferChico.strokeWeight(this.TEXTO_BORDE_GROSOR / pixelSize);
      bufferChico.fill(this.TEXTO_COLOR[0], this.TEXTO_COLOR[1], this.TEXTO_COLOR[2]);
      bufferChico.text(cat.nombre, textoDestX / pixelSize, textoDestY / pixelSize);

      push();
      noSmooth();
      imageMode(CORNER);
      image(bufferChico, 0, 0, width, height);
      pop();

      bufferChico.remove();
    }
  }
};