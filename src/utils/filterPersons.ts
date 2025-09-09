import { PersonData } from "../components/FilteredPersonsTable";

// Recibe un registro y extrae los datos personales relevantes
export function extractPersonData(row: any): PersonData {
  const responses = row.responses_data?.OTROS || {};
  const location = row.location_data || {};
  return {
    sexo:
      responses["¿Cuál es su identidad de género / la identidad de género de la persona con discapacidad actualmente?"] ||
      responses["¿Qué sexo le fue asignado al nacer en su certificado de nacimiento / en el certificado de nacimiento de la persona con discapacidad?"] ||
      "",
    nombre:
      `${responses["PRIMER NOMBRE"] || ""} ${responses["SEGUNDO NOMBRE"] || ""} ${responses["PRIMER APELLIDO"] || ""} ${responses["SEGUNDO APELLIDO"] || ""}`.trim(),
    direccion: location.address || "",
    celular: responses["Celular 1"] || "",
    barrio: location.barrio || "",
    // Puedes agregar más campos aquí si lo necesitas
  };
}

// Recibe un array de registros y filtros, retorna los datos personales filtrados
// Filtros soportados: barrio, sexo, nombre, celular
export function filterPersonsData(rows: any[], filters: any): PersonData[] {
  // Ejemplo de estructura de filters:
  // { barrio: 'Carrizal', sexo: 'Mujer', nombre: 'MIRIAM', celular: '3145712947' }
  let filtered = rows.filter(row => {
    const responses = row.responses_data?.OTROS || {};
    const location = row.location_data || {};
    let match = true;
    if (filters.barrio && location.barrio !== filters.barrio) match = false;
    if (filters.sexo && (
      responses["¿Cuál es su identidad de género / la identidad de género de la persona con discapacidad actualmente?"] !== filters.sexo &&
      responses["¿Qué sexo le fue asignado al nacer en su certificado de nacimiento / en el certificado de nacimiento de la persona con discapacidad?"] !== filters.sexo
    )) match = false;
    if (filters.nombre) {
      const nombreCompleto = `${responses["PRIMER NOMBRE"] || ""} ${responses["SEGUNDO NOMBRE"] || ""} ${responses["PRIMER APELLIDO"] || ""} ${responses["SEGUNDO APELLIDO"] || ""}`.trim();
      if (!nombreCompleto.toLowerCase().includes(filters.nombre.toLowerCase())) match = false;
    }
    if (filters.celular && responses["Celular 1"] !== filters.celular) match = false;
    // Puedes agregar más filtros aquí
    return match;
  });
  return filtered.map(extractPersonData);
}

// Recibe los registros filtrados y retorna solo los datos personales
export function getFilteredPersonDetails(filteredRows: any[]): PersonData[] {
  return filteredRows.map(row => {
    const responses = row.responses_data?.OTROS || {};
    const location = row.location_data || {};
    return {
      sexo:
        responses["¿Cuál es su identidad de género / la identidad de género de la persona con discapacidad actualmente?"] ||
        responses["¿Qué sexo le fue asignado al nacer en su certificado de nacimiento / en el certificado de nacimiento de la persona con discapacidad?"] ||
        "",
      nombre:
        `${responses["PRIMER NOMBRE"] || ""} ${responses["SEGUNDO NOMBRE"] || ""} ${responses["PRIMER APELLIDO"] || ""} ${responses["SEGUNDO APELLIDO"] || ""}`.trim(),
      direccion: location.address || "",
      celular: responses["Celular 1"] || "",
      barrio: location.barrio || "",
    };
  });
}
