let esc_final_2 = {
    usaGiro: false,

    // --- FILTRO: qué cuenta como "resaltado" (rojo, por color) ---
    FILTRO: function (fila) {
        return fila[0] === "c";
    },

    TEXTO_1: "A mayor cercanía, el saludo tiende a ser físico",
    TEXTO_2: "",

    TEXTO_1_X: 0.5,
    TEXTO_1_Y: 0.03,
    TEXTO_2_X: 0.4,
    TEXTO_2_Y: 0.9,

    TEXTO_TAMANO: 0.04,
    TEXTO_FUENTE: "Helvetica",
    TEXTO_COLOR: [0, 0, 0],
    TEXTO_BORDE_COLOR: [255, 255, 255],
    TEXTO_BORDE_GROSOR: 0,
    TEXTO_INTERLINEA: 0.05,
    PIXEL_INICIO: 24,
    PIXEL_FIN: 1,

    // --- Opacidades ---
    OPACIDAD_RESALTE: 255,
    OPACIDAD_OTROS: 5,

    DURACION_FIGURAS: 200,   // rojas subiendo su opacidad, una por una
    DURACION_OTROS: 150,     // el resto bajando su opacidad, en paralelo
    DURACION_IMAGEN: 70,     // texto nitidizándose
    DURACION_PAUSA_MEDIO: 50, // pausa antes de pasar a la fase 2

    FASE1_LARGO: 0,
    DURACION_IMAGEN_SALIDA: 50, // fase 3: cuánto tarda el texto en pixelarse y desaparecer, al final de todo

    // --- Fase 2: las rojas se desvanecen en cascada (grupos), el resto se queda como está ---
    GRUPO_TAMANO: 3,
    DURACION_FADE_INDIVIDUAL: 40,
    INTERVALO_ENTRE_GRUPOS: 8,

    FASE2_LARGO: 0,
    duracion: 0,

    frameInicioEscena: 0,
    puntosResaltados: [],

    iniciar: function (puntos, tamanoModulo) {
        this.frameInicioEscena = reloj;

        this.FASE1_LARGO = max(this.DURACION_FIGURAS, this.DURACION_OTROS, this.DURACION_IMAGEN) + this.DURACION_PAUSA_MEDIO;

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

        let totalGrupos = ceil(total / this.GRUPO_TAMANO);
        for (let i = 0; i < total; i++) {
            let p = this.puntosResaltados[i];
            let grupo = floor(i / this.GRUPO_TAMANO);
            p._f2Inicio = this.FASE1_LARGO + (grupo * this.INTERVALO_ENTRE_GRUPOS);
            p._f2Fin = p._f2Inicio + this.DURACION_FADE_INDIVIDUAL;
        }

        this.FASE2_LARGO = (totalGrupos - 1) * this.INTERVALO_ENTRE_GRUPOS + this.DURACION_FADE_INDIVIDUAL;

        // La escena completa dura: fase 1 + fase 2 (figuras desvaneciéndose) + fase 3 (texto saliendo)
        this.duracion = this.FASE1_LARGO + this.FASE2_LARGO + this.DURACION_IMAGEN_SALIDA;
    },

    dibujar: function (puntos, tamanoModulo) {
        imageMode(CENTER);

        let framesTranscurridos = reloj - this.frameInicioEscena;
        let inicioFase2 = this.FASE1_LARGO;
        let inicioFase3 = this.FASE1_LARGO + this.FASE2_LARGO; // cuando ya se desvanecieron todas las rojas
        let enFase2 = framesTranscurridos >= inicioFase2;

        for (let p of puntos) {
            let esResaltado = this.FILTRO(datos[p.datosIndex]);
            let opacidad;

            if (esResaltado) {
                if (!enFase2) {
                    opacidad = map(framesTranscurridos, p._f1Inicio, p._f1Fin, OPACIDAD, this.OPACIDAD_RESALTE, true);
                } else {
                    opacidad = map(framesTranscurridos, p._f2Inicio, p._f2Fin, this.OPACIDAD_RESALTE, 0, true);
                }
            } else {
                let t1 = constrain(framesTranscurridos / this.DURACION_OTROS, 0, 1);
                opacidad = lerp(OPACIDAD, this.OPACIDAD_OTROS, t1);
            }

            tint(255, opacidad);
            image(p.img, p.x, p.y, p.tamano, p.tamano);
        }

        tint(255, 255);

        // --- Texto pixelado: aparece (fase 1), se mantiene fijo (fase 1-2), y se pixela/desaparece (fase 3) ---
        let pixelSize, opacidadTexto;

        if (framesTranscurridos < inicioFase3) {
            // Fase 1 y 2: se nitidiza al inicio y se mantiene fijo el resto del tiempo
            let t1 = constrain(framesTranscurridos / this.DURACION_IMAGEN, 0, 1);
            let tSuave1 = 1 - pow(1 - t1, 3);
            pixelSize = round(lerp(this.PIXEL_INICIO, this.PIXEL_FIN, tSuave1));
            opacidadTexto = 255;
        } else {
            // Fase 3: se pixela y desaparece, igual que entró pero al revés
            let framesFase3 = framesTranscurridos - inicioFase3;
            let t3 = constrain(framesFase3 / this.DURACION_IMAGEN_SALIDA, 0, 1);
            let tSuave3 = pow(t3, 3); // ease-in, mismo estilo que usamos en las salidas de otras escenas
            pixelSize = round(lerp(this.PIXEL_FIN, this.PIXEL_INICIO, tSuave3));
            opacidadTexto = lerp(255, 0, tSuave3);
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