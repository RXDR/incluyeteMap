/**
 * Mapeo de categorías a preguntas para la aplicación de encuestas
 * Este archivo define la estructura de categorías, preguntas y sus descripciones
 */

export const QUESTION_MAPPING: Record<string, Record<string, string>> = {
  "TIPO DE DISCAPACIDAD": {
    "Pensar, memorizar": "¿Tiene dificultad para pensar o memorizar?",
    "Caminar o subir escaleras": "¿Tiene dificultad para caminar o subir escaleras?",
    "Ver, incluso con anteojos": "¿Tiene dificultad para ver, incluso usando anteojos?",
    "Escuchar, incluso con audífono": "¿Tiene dificultad para escuchar, incluso usando audífono?",
    "Comunicarse o hacerse entender": "¿Tiene dificultad para comunicarse o hacerse entender?"
  },
  "CAUSAS DE DISCAPACIDAD": {
    "Por enfermedad": "¿Su condición es causada por una enfermedad?",
    "Por edad avanzada": "¿Su condición es causada por edad avanzada?",
    "Por accidente": "¿Su condición es causada por un accidente?",
    "Por violencia": "¿Su condición es causada por violencia?",
    "Congénita": "¿Su condición es congénita (de nacimiento)?"
  },
  "SALUD": {
    "Estado de salud": "¿Cómo calificaría su estado general de salud?",
    "Acceso a servicios": "¿Tiene acceso a servicios de salud?",
    "Recibe tratamiento": "¿Recibe actualmente tratamiento médico?",
    "EPS afiliación": "¿A qué EPS está afiliado?",
    "Régimen de salud": "¿A qué régimen de salud pertenece?"
  },
  "EDUCACIÓN": {
    "Nivel educativo": "¿Cuál es su nivel educativo más alto alcanzado?",
    "Sabe leer y escribir": "¿Sabe leer y escribir?",
    "Asiste a institución educativa": "¿Actualmente asiste a alguna institución educativa?",
    "Requiere apoyo educativo": "¿Requiere algún tipo de apoyo educativo especial?"
  },
  "TRABAJO": {
    "Situación laboral": "¿Cuál es su situación laboral actual?",
    "Ingresos mensuales": "¿Cuál es su rango de ingresos mensuales?",
    "Recibe subsidios": "¿Recibe algún tipo de subsidio?",
    "Tipo de trabajo": "¿Qué tipo de trabajo realiza?",
    "Contrato laboral": "¿Qué tipo de contrato laboral tiene?"
  },
  "VIVIENDA": {
    "Tipo de vivienda": "¿En qué tipo de vivienda vive?",
    "Estrato socioeconómico": "¿A qué estrato socioeconómico pertenece su vivienda?",
    "Propiedad de vivienda": "¿La vivienda donde habita es propia, alquilada o familiar?",
    "Accesibilidad vivienda": "¿Su vivienda cuenta con condiciones de accesibilidad?"
  },
  "PARTICIPACIÓN SOCIAL": {
    "Participa en actividades comunitarias": "¿Participa en actividades comunitarias?",
    "Pertenece a organización": "¿Pertenece a alguna organización social?",
    "Vota en elecciones": "¿Participa en procesos electorales (vota)?",
    "Acceso a espacios públicos": "¿Tiene acceso a espacios públicos?"
  },
  "AYUDAS TÉCNICAS": {
    "Usa ayudas técnicas": "¿Usa algún tipo de ayuda técnica (bastón, silla de ruedas, etc.)?",
    "Necesita ayudas técnicas": "¿Necesita alguna ayuda técnica que no tiene actualmente?",
    "Recibe apoyo institucional": "¿Recibe apoyo institucional para sus necesidades especiales?"
  }
};

export default QUESTION_MAPPING;
