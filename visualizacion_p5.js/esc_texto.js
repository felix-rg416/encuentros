let esc_texto = {
    usaGiro: false,
    duracion: 200, // frames que dura esta escena (ajustable)

    // === Textos que aparecen sobre "esc_quien_inicia" ===
    TEXTO_1: "Yo inicié\nel saludo",
    TEXTO_2: "Otra persona\ninició el saludo",

    TEXTO_1_X: 0.10,
    TEXTO_1_Y: 0.45,

    TEXTO_2_X: 0.85,
    TEXTO_2_Y: 0.45,

    TEXTO_TAMANO: 0.03,
    TEXTO_FUENTE: "Helvetica",
    TEXTO_COLOR: [0, 0, 0],
    TEXTO_BORDE_COLOR: [255, 255, 255],
    TEXTO_BORDE_GROSOR: 0,
    TEXTO_INTERLINEA: 0.03,

    PIXEL_INICIO: 20,
    PIXEL_FIN: 1,

    DURACION_TEXTO: 90, // cuánto tarda el efecto de pixelado (independiente de "duracion" de la escena)

    frameInicioEscena: 0,

    // --- Líneas: coordenadas de anclaje definidas a mano (no dependen de otra escena) ---
    LINEA_COLOR: [128, 128, 128],
    LINEA_GROSOR: 5,
    CODO_FRACCION: 0.5,
    TEXTO_LINEA_OFFSET_Y: 0.014,
    TEXTO_LINEA_OFFSET_X: 0,
    DURACION_LINEA: 200, // dura lo mismo que el texto por defecto, ajustable aparte

    // Cada línea: a qué texto pertenece ("1" o "2"), desde qué punto sale (anclaje fijo en x,y),
    // y si conecta al borde superior o inferior del bloque de texto
    LINEAS: [
        { texto: 1, anclajeX: 0.20, anclajeY: 0.30, lado: "arriba" }, // Yo inicié -> círculo Físico
        { texto: 1, anclajeX: 0.20, anclajeY: 0.72, lado: "abaajo" }, // Yo inicié -> círculo Verbal
        { texto: 2, anclajeX: 0.70, anclajeY: 0.30, lado: "arriba" }, // Otra persona -> círculo Físico
        { texto: 2, anclajeX: 0.70, anclajeY: 0.72, lado: "abajo" }  // Otra persona -> círculo Verbal
    ],

    frameInicioEscena: 0,

    iniciar: function (puntos, tamanoModulo) {
        this.frameInicioEscena = reloj;
    },

    // Punto exacto donde la línea toca el borde superior o inferior del bloque de texto completo
    calcularPuntoTexto: function (lineaCfg) {
        let textoCompleto = lineaCfg.texto === 1 ? this.TEXTO_1 : this.TEXTO_2;
        let textoDestX = width * (lineaCfg.texto === 1 ? this.TEXTO_1_X : this.TEXTO_2_X);
        let textoBaseY = height * (lineaCfg.texto === 1 ? this.TEXTO_1_Y : this.TEXTO_2_Y);

        let lineas = textoCompleto.split("\n");
        let interlinea = height * this.TEXTO_INTERLINEA;
        let tamanoFuentePx = width * this.TEXTO_TAMANO;

        // Alto total del bloque: desde el borde superior de la 1ra línea hasta el borde inferior de la última
        let altoBloque = (lineas.length - 1) * interlinea + tamanoFuentePx;

        let offsetY = height * this.TEXTO_LINEA_OFFSET_Y;
        let y = (lineaCfg.lado === "arriba")
            ? textoBaseY - offsetY
            : textoBaseY + altoBloque + offsetY;

        // El centro X del bloque de texto (ya que está centrado, TEXTO_X ya ES el centro)
        let offsetX = width * this.TEXTO_LINEA_OFFSET_X;
        let x = textoDestX + offsetX;

        return { x, y };
    },

    dibujarLineaProgresiva: function (puntos, t) {
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

        beginShape();
        noFill();
        for (let p of puntos) vertex(p.x, p.y);
        endShape();
    },

    dibujar: function (puntos, tamanoModulo) {
        esc_quien_inicia.dibujar(puntos, tamanoModulo);

        let framesTranscurridos = reloj - this.frameInicioEscena;

        // --- Líneas ---
        let tLinea = constrain(framesTranscurridos / this.DURACION_LINEA, 0, 1);
        let tLineaSuave = 1 - pow(1 - tLinea, 3);

        for (let cfg of this.LINEAS) {
            let anclaje = { x: width * cfg.anclajeX, y: height * cfg.anclajeY };
            let puntoTexto = this.calcularPuntoTexto(cfg);

            let codo = {
                x: lerp(anclaje.x, puntoTexto.x, this.CODO_FRACCION),
                y: puntoTexto.y
            };

            push();
            stroke(this.LINEA_COLOR[0], this.LINEA_COLOR[1], this.LINEA_COLOR[2]);
            strokeWeight(this.LINEA_GROSOR);
            this.dibujarLineaProgresiva([anclaje, codo, puntoTexto], tLineaSuave);
            pop();
        }

        // --- Texto pixelado ---
        let t = constrain(framesTranscurridos / this.DURACION_TEXTO, 0, 1);
        let tSuave = 1 - pow(1 - t, 3);

        let pixelSize = round(lerp(this.PIXEL_INICIO, this.PIXEL_FIN, tSuave));
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
        tint(255, 255);
        image(bufferChico, 0, 0, width, height);
        pop();

        bufferChico.remove();
    }
};