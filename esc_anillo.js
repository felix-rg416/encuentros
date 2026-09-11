let esc_anillo = {
  duracion: 150,
  usaGiro: true,

  ESTADO_INICIO: {
    // cx, cy: posición del centro de la elipse
    // rx, ry: radio horizontal y vertical de la elipse
    3: { cx: 0.38, cy: 0.50, rx: 0.25, ry: 0.40, rotacionGrados: 0 }, // otros
    2: { cx: 0.50, cy: 0.50, rx: 0.25, ry: 0.40, rotacionGrados: 0 }, // universidad
    1: { cx: 0.62, cy: 0.50, rx: 0.25, ry: 0.40, rotacionGrados: 0 }  // casa
  },

  // si se modifica, cambiar tambien "ESTADO_INICIO" de "esc_atomo"
  ESTADO_FIN: {
    3: { cx: 0.50, cy: 0.50, rx: 0.20, ry: 0.40, rotacionGrados: 35 }, // otros
    2: { cx: 0.55, cy: 0.53, rx: 0.20, ry: 0.40, rotacionGrados: 35 }, // universidad
    1: { cx: 0.60, cy: 0.56, rx: 0.20, ry: 0.40, rotacionGrados: 35 }  // casa
  },

  frameInicioEscena: 0,

  iniciar: function () {
    this.frameInicioEscena = reloj;
  },

  dibujar: function (puntos, tamanoModulo) {
    
    imageMode(CENTER);
    tint(255, OPACIDAD);

    let framesTranscurridos = reloj - this.frameInicioEscena;
    let t = constrain(framesTranscurridos / this.duracion, 0, 1);

    for (let p of puntos) {
      let inicio = this.ESTADO_INICIO[p.contorno];
      let fin = this.ESTADO_FIN[p.contorno];

      let cx = lerp(width * inicio.cx, width * fin.cx, t);
      let cy = lerp(height * inicio.cy, height * fin.cy, t);
      let rx = lerp(width * inicio.rx, width * fin.rx, t);
      let ry = lerp(height * inicio.ry, height * fin.ry, t);
      let rot = radians(lerp(inicio.rotacionGrados, fin.rotacionGrados, t)); // conversión acá, dentro de dibujar()

      let xLocal = cos(p.angulo) * rx;
      let yLocal = sin(p.angulo) * ry;

      let x = cx + (xLocal * cos(rot) - yLocal * sin(rot));
      let y = cy + (xLocal * sin(rot) + yLocal * cos(rot));
      p.x = x;
      p.y = y;
      image(p.img, x, y, tamanoModulo, tamanoModulo);
    }
  }
};