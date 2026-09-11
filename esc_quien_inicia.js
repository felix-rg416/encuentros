let esc_quien_inicia = {
  duracion: 200,
  usaGiro: false,

  // Cada grupo combina "tipo de saludo" + "yo inicié" (c_punto).
  // Las figuras que NO califican (s_punto) se quedan quietas en su posición actual.
  GRUPOS: [
    { filtro: (fila) => fila[0] === "c" && fila[2] === "c_punto", centroX: 0.25, centroY: 0.25 }, // Físico + yo inicié
    { filtro: (fila) => fila[0] === "x" && fila[2] === "s_punto", centroX: 0.70, centroY: 0.7 },  // Verbal + yo inicié
    { filtro: (fila) => fila[0] === "c" && fila[2] === "s_punto", centroX: 0.7, centroY: 0.25 }, // Físico -> cerca de la esquina superior derecha
    { filtro: (fila) => fila[0] === "x" && fila[2] === "c_punto", centroX: 0.25, centroY: 0.7 }  // Verbal  -> cerca de la esquina inferior izquierda
  ],

  RADIO_MAXIMO_PROPORCION: 0.15, // más chico que esc_agrupa_forma (0.20), ya que es un subconjunto
  ESPACIO_FACTOR_MAXIMO: 1.15,
  ANGULO_DORADO: 2.399963229728653,

  TAMANO_FACTOR: 1,

  frameInicioEscena: 0,

  iniciar: function(puntos, tamanoModulo) {
    this.frameInicioEscena = reloj;

    let tamanoFinal = tamanoModulo * this.TAMANO_FACTOR;

    for (let grupo of this.GRUPOS) {
      let lista = puntos
        .filter(p => grupo.filtro(datos[p.datosIndex]))
        .sort((a, b) => a.datosIndex - b.datosIndex);

      let total = lista.length;
      let cx = width * grupo.centroX;
      let cy = height * grupo.centroY;

      let cIdeal = tamanoFinal * this.ESPACIO_FACTOR_MAXIMO;
      let radioMaximo = min(width, height) * this.RADIO_MAXIMO_PROPORCION;
      let cQueCabe = radioMaximo / sqrt(total);
      let c = min(cIdeal, cQueCabe);

      for (let i = 0; i < total; i++) {
        let p = lista[i];
        p._inicioX = p.x;
        p._inicioY = p.y;
        p._tamanoInicio = p.tamano;
        p._tamanoFin = tamanoFinal;

        let angulo = i * this.ANGULO_DORADO;
        let radio = c * sqrt(i + 1);

        p._destinoX = cx + cos(angulo) * radio;
        p._destinoY = cy + sin(angulo) * radio;
      }
    }

    // Las figuras que no calzan con ningún grupo (s_punto) se quedan donde están
    for (let p of puntos) {
      let calza = this.GRUPOS.some(g => g.filtro(datos[p.datosIndex]));
      if (!calza) {
        p._inicioX = p.x;
        p._inicioY = p.y;
        p._tamanoInicio = p.tamano;
        p._destinoX = p.x;
        p._destinoY = p.y;
        p._tamanoFin = p.tamano;
      }
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