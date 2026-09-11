// ============================
// explosion ordenada por color
// ============================

let esc_explosion_2 = {
  duracion: 100,
  usaGiro: false,

  CENTRO: { cx: 0.5, cy: 0.5 },

  RADIO_MAXIMO_PROPORCION: 0.45,
  ESPACIO_FACTOR_MAXIMO: 1.15,
  ANGULO_DORADO: 2.399963229728653,
  CRECIMIENTO_FACTOR: 1.5,

  frameInicioEscena: 0,

  iniciar: function(puntos, tamanoModulo) {
    this.frameInicioEscena = reloj;

    let cx = width * this.CENTRO.cx;
    let cy = height * this.CENTRO.cy;
    let tamanoFinal = tamanoModulo * this.CRECIMIENTO_FACTOR;
    let total = puntos.length;

    // --- Reordenamos los puntos por color: rojo (centro) -> azul -> verde (borde) ---
    // Dentro de cada color, se mantiene el orden cronológico original (datosIndex)
    let ordenColor = { "rojo": 0, "azul": 1, "verde": 2 };
    let puntosOrdenados = [...puntos].sort((a, b) => {
      let diff = ordenColor[a.color] - ordenColor[b.color];
      if (diff !== 0) return diff;
      return a.datosIndex - b.datosIndex;
    });

    let cIdeal = tamanoFinal * this.ESPACIO_FACTOR_MAXIMO;
    let radioMaximo = min(width, height) * this.RADIO_MAXIMO_PROPORCION;
    let cQueCabe = radioMaximo / sqrt(total);
    let c = min(cIdeal, cQueCabe);

    // Usamos el índice DENTRO de "puntosOrdenados" (no el orden original) para el ángulo/radio
    for (let i = 0; i < total; i++) {
      let p = puntosOrdenados[i];
      p._inicioX = p.x;
      p._inicioY = p.y;
      p._tamanoInicio = tamanoModulo;
      p._tamanoFin = tamanoFinal;

      let angulo = i * this.ANGULO_DORADO;
      let radio = c * sqrt(i + 1);

      p._destinoX = cx + cos(angulo) * radio;
      p._destinoY = cy + sin(angulo) * radio;
    }
  },

  dibujar: function(puntos, tamanoModulo) {
    imageMode(CENTER);
    tint(255, OPACIDAD);

    let framesTranscurridos = reloj - this.frameInicioEscena;
    let t = constrain(framesTranscurridos / this.duracion, 0, 1);
    let tSuave = 1 - pow(1 - t, 3);

    for (let p of puntos) {
      let x = lerp(p._inicioX, p._destinoX, tSuave);
      let y = lerp(p._inicioY, p._destinoY, tSuave);
      let tamano = lerp(p._tamanoInicio, p._tamanoFin, tSuave);

      p.x = x;
      p.y = y;
      p.tamano = tamano;

      image(p.img, x, y, tamano, tamano);
    }
  }
};