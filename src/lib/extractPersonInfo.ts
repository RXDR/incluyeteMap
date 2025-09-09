// Extrae información personal del encuestado desde un registro survey_response
// Recibe un objeto con la estructura de survey_response y retorna los datos clave

export interface PersonInfo {
  nombre: string;
  documento: string;
  sexo_identidad: string;
  sexo_nacimiento: string;
  celular: string;
  direccion: string;
  barrio: string;
  localidad: string;
  coord_x: number;
  coord_y: number;
  edad: string;
}

export function extractPersonInfo(surveyResponse: any): PersonInfo {
  const otros = surveyResponse.responses_data?.OTROS || {};
  const location = surveyResponse.location_data || {};
  const coords = location.coordinates || {};

  return {
    nombre: [otros['PRIMER NOMBRE'], otros['SEGUNDO NOMBRE'], otros['PRIMER APELLIDO'], otros['SEGUNDO APELLIDO']].filter(Boolean).join(' '),
    documento: otros['Número de documento de la persona con discapacidad'] || '',
    sexo_identidad: otros['¿Cuál es su identidad de género / la identidad de género de la persona con discapacidad actualmente?'] || '',
    sexo_nacimiento: otros['¿Qué sexo le fue asignado al nacer en su certificado de nacimiento / en el certificado de nacimiento de la persona con discapacidad?'] || '',
    celular: [otros['Celular 1'], otros['Celular 2']].filter(Boolean).join(' / '),
    direccion: location.address || '',
    barrio: location.barrio || '',
    localidad: location.localidad || '',
    coord_x: coords.x || null,
    coord_y: coords.y || null,
    edad: otros['Edad de la persona con discapacidad'] || '',
  };
}
