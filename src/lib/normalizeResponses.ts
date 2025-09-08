// src/lib/normalizeResponses.ts
// Función para normalizar y agrupar respuestas de texto (para usar en backend o frontend)

/**
 * Normaliza y agrupa respuestas de texto (por ejemplo, "si", "SI", "Si" → "Si")
 * @param value Texto de la respuesta
 * @returns Respuesta normalizada para visualización y agrupación
 */
export function normalizeResponseLabel(value: string): string {
  if (!value) return '';
  const norm = value.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toUpperCase();
  if (["SI", "SÍ"].includes(norm)) return "Si";
  if (["NO"].includes(norm)) return "No";
  if (["FEMENINO"].includes(norm)) return "Femenino";
  if (["MASCULINO"].includes(norm)) return "Masculino";
  if (["MUJER"].includes(norm)) return "Mujer";
  if (["HOMBRE"].includes(norm)) return "Hombre";
  // Capitaliza por defecto
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

/**
 * Normaliza un array de respuestas, agrupando variantes y sumando los conteos
 * @param data Array de objetos { key: string, value: number }
 * @returns Array agrupado y normalizado para visualización
 */
export function groupAndNormalizeResponses<T extends { key: string; value: number }>(data: T[]) {
  const grouped: Record<string, number> = {};
  for (const item of data) {
    const label = normalizeResponseLabel(item.key);
    grouped[label] = (grouped[label] || 0) + item.value;
  }
  return Object.entries(grouped).map(([label, value]) => ({ label, value }));
}
