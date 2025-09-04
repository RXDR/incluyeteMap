import React, { useState } from 'react';

function PreguntasRespuestas({ preguntas, onClear }) {
  const [respuestaActiva, setRespuestaActiva] = useState(null);

  const handleSeleccionarRespuesta = (preguntaId, respuesta) => {
    if (respuestaActiva === preguntaId) {
      alert('Debe limpiar la respuesta activa antes de seleccionar otra.');
      return;
    }
    setRespuestaActiva(preguntaId);
  };

  const handleLimpiarRespuesta = () => {
    setRespuestaActiva(null);
    onClear();
  };

  return (
    <div>
      {preguntas.map((pregunta) => (
        <div key={pregunta.id}>
          <h3>{pregunta.texto}</h3>
          {pregunta.respuestas.map((respuesta) => (
            <button
              key={respuesta}
              onClick={() => handleSeleccionarRespuesta(pregunta.id, respuesta)}
              disabled={respuestaActiva === pregunta.id}
            >
              {respuesta}
            </button>
          ))}
          {respuestaActiva === pregunta.id && (
            <button onClick={handleLimpiarRespuesta}>Limpiar</button>
          )}
        </div>
      ))}
    </div>
  );
}

export default PreguntasRespuestas;