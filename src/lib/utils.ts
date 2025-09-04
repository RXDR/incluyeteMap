import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Crea una versión debounced de una función que retrasa su ejecución
 * hasta después de esperar un tiempo determinado desde la última invocación.
 * 
 * @param func La función a aplicar debounce
 * @param wait Tiempo de espera en milisegundos
 * @returns Función con debounce aplicado
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Crea una versión throttled de una función que limita su ejecución
 * a una vez cada cierto periodo de tiempo.
 * 
 * @param func La función a aplicar throttle
 * @param limit Límite de tiempo en milisegundos
 * @returns Función con throttle aplicado
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Retrasa la ejecución de una función por un tiempo determinado.
 * 
 * @param ms Tiempo en milisegundos
 * @returns Promise que se resuelve después del tiempo especificado
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Convierte un array en fragmentos de un tamaño específico.
 * Útil para procesar grandes conjuntos de datos en lotes.
 * 
 * @param array Array a dividir
 * @param size Tamaño de cada fragmento
 * @returns Array de arrays, cada uno del tamaño especificado
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Formatear números grandes con separadores de miles para mejor legibilidad.
 * 
 * @param num Número a formatear
 * @returns Número formateado como string con separadores de miles
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Memoiza una función para evitar cálculos repetidos con los mismos argumentos.
 * 
 * @param fn Función a memoizar
 * @returns Función memoizada
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T
): (...args: Parameters<T>) => ReturnType<T> {
  const cache = new Map();
  
  return (...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Compara de manera profunda dos objetos para verificar si son iguales.
 * 
 * @param obj1 Primer objeto
 * @param obj2 Segundo objeto
 * @returns Booleano indicando si los objetos son iguales
 */
export function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  
  if (typeof obj1 !== 'object' || obj1 === null || 
      typeof obj2 !== 'object' || obj2 === null) {
    return false;
  }
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }
  
  return true;
}
