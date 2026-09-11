// Fábrica de escenas de pausa: en vez de "congelar" x/y a mano,
// reutiliza la función dibujar() de la escena anterior (escenaBase),
// sin volver a llamar su iniciar(). Así su "t" interno queda fijo en 1
// (su formación final), pero el giro sigue funcionando si esa escena lo usaba.
function crearEscenaPausa(frames, escenaBase) {
  return {
    duracion: frames,
    usaGiro: escenaBase.usaGiro, // mantiene el mismo comportamiento de giro que la escena anterior

    iniciar: function() {
      // no hacemos nada a propósito: dejamos que "escenaBase" siga
      // usando su propio frameInicioEscena, ya vencido, para quedar en su estado final
    },

    dibujar: function(puntos, tamanoModulo) {
      escenaBase.dibujar(puntos, tamanoModulo);
    }
  };
}