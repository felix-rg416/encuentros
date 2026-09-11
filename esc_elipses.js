let esc_elipses = {
  duracion: 100, // frames que dura esta escena
  usaGiro: true,

  // posiciones y tamaños de las 3 elipses

  ELIPSES_PROPORCION: {
    // cx, cy: posición del centro de la elipse
    // rx, ry: radio horizontal y vertical de la elipse
    3: { cx: 0.38, cy: 0.50, rx: 0.25, ry: 0.40 }, // otros
    2: { cx: 0.50, cy: 0.50, rx: 0.25, ry: 0.40 }, // universidad
    1: { cx: 0.62, cy: 0.50, rx: 0.25, ry: 0.40 }  // casa
  },

  iniciar: function () {
    // esta escena no necesita preparar nada especial
  },

  dibujar: function (puntos, tamanoModulo) {
    imageMode(CENTER);
    tint(255, OPACIDAD);

    for (let p of puntos) {
      let e = this.ELIPSES_PROPORCION[p.contorno];
      let x = width * e.cx + cos(p.angulo) * (width * e.rx);
      let y = height * e.cy + sin(p.angulo) * (height * e.ry);
      p.x = x;
      p.y = y;
      image(p.img, x, y, tamanoModulo, tamanoModulo);
    }
  }
};