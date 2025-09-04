export interface BarrioData {
  id: string;
  name: string;
  comuna: string;
  coordinates: [number, number];
  population: number;
  households: number;
  area: number; // en km²
  density: number; // habitantes/km²
  sewerage: number; // porcentaje de cobertura
  energy: number; // porcentaje de cobertura
  internet: number; // porcentaje de cobertura
  education: number; // porcentaje de cobertura educativa
  health: number; // porcentaje de cobertura de salud
  poverty: number; // porcentaje de población en pobreza
  stratum: number; // estrato socioeconómico promedio
}

export const barranquillaBarrios: BarrioData[] = [
  // Comuna 1 - Norte
  {
    id: 'barranquilla-1-1',
    name: 'Riomar',
    comuna: '1',
    coordinates: [-74.7963, 10.9685],
    population: 45000,
    households: 12000,
    area: 2.5,
    density: 18000,
    sewerage: 98,
    energy: 100,
    internet: 95,
    education: 92,
    health: 88,
    poverty: 5,
    stratum: 6
  },
  {
    id: 'barranquilla-1-2',
    name: 'Alto Prado',
    comuna: '1',
    coordinates: [-74.7980, 10.9660],
    population: 38000,
    households: 9500,
    area: 3.2,
    density: 11875,
    sewerage: 96,
    energy: 100,
    internet: 92,
    education: 90,
    health: 85,
    poverty: 8,
    stratum: 5
  },
  {
    id: 'barranquilla-1-3',
    name: 'Prado',
    comuna: '1',
    coordinates: [-74.8000, 10.9640],
    population: 42000,
    households: 11000,
    area: 2.8,
    density: 15000,
    sewerage: 94,
    energy: 99,
    internet: 88,
    education: 87,
    health: 82,
    poverty: 12,
    stratum: 4
  },

  // Comuna 2 - Centro
  {
    id: 'barranquilla-2-1',
    name: 'Centro Histórico',
    comuna: '2',
    coordinates: [-74.8020, 10.9620],
    population: 28000,
    households: 7000,
    area: 1.8,
    density: 15556,
    sewerage: 92,
    energy: 98,
    internet: 85,
    education: 84,
    health: 78,
    poverty: 15,
    stratum: 3
  },
  {
    id: 'barranquilla-2-2',
    name: 'San Roque',
    comuna: '2',
    coordinates: [-74.8040, 10.9600],
    population: 32000,
    households: 8000,
    area: 2.1,
    density: 15238,
    sewerage: 90,
    energy: 97,
    internet: 82,
    education: 81,
    health: 75,
    poverty: 18,
    stratum: 3
  },

  // Comuna 3 - Sur
  {
    id: 'barranquilla-3-1',
    name: 'Las Nieves',
    comuna: '3',
    coordinates: [-74.8060, 10.9580],
    population: 35000,
    households: 9000,
    area: 2.3,
    density: 15217,
    sewerage: 88,
    energy: 96,
    internet: 78,
    education: 79,
    health: 72,
    poverty: 22,
    stratum: 3
  },
  {
    id: 'barranquilla-3-2',
    name: 'Siape',
    comuna: '3',
    coordinates: [-74.8080, 10.9560],
    population: 40000,
    households: 10000,
    area: 2.6,
    density: 15385,
    sewerage: 85,
    energy: 94,
    internet: 75,
    education: 76,
    health: 68,
    poverty: 25,
    stratum: 2
  },

  // Comuna 4 - Suroccidente
  {
    id: 'barranquilla-4-1',
    name: 'La Manga',
    comuna: '4',
    coordinates: [-74.8100, 10.9540],
    population: 45000,
    households: 11500,
    area: 3.0,
    density: 15000,
    sewerage: 82,
    energy: 92,
    internet: 70,
    education: 73,
    health: 65,
    poverty: 28,
    stratum: 2
  },
  {
    id: 'barranquilla-4-2',
    name: 'Villa Santos',
    comuna: '4',
    coordinates: [-74.8120, 10.9520],
    population: 38000,
    households: 9500,
    area: 2.7,
    density: 14074,
    sewerage: 80,
    energy: 90,
    internet: 68,
    education: 71,
    health: 62,
    poverty: 32,
    stratum: 2
  },

  // Comuna 5 - Metropolitana
  {
    id: 'barranquilla-5-1',
    name: 'La Playa',
    comuna: '5',
    coordinates: [-74.8140, 10.9500],
    population: 42000,
    households: 10500,
    area: 2.9,
    density: 14483,
    sewerage: 78,
    energy: 88,
    internet: 65,
    education: 68,
    health: 58,
    poverty: 35,
    stratum: 2
  },
  {
    id: 'barranquilla-5-2',
    name: 'El Bosque',
    comuna: '5',
    coordinates: [-74.8160, 10.9480],
    population: 35000,
    households: 8800,
    area: 2.4,
    density: 14583,
    sewerage: 75,
    energy: 85,
    internet: 62,
    education: 65,
    health: 55,
    poverty: 38,
    stratum: 2
  },

  // Comuna 6 - Noroccidente
  {
    id: 'barranquilla-6-1',
    name: 'Villa Campestre',
    comuna: '6',
    coordinates: [-74.8180, 10.9460],
    population: 48000,
    households: 12000,
    area: 3.3,
    density: 14545,
    sewerage: 72,
    energy: 82,
    internet: 58,
    education: 62,
    health: 52,
    poverty: 42,
    stratum: 1
  },
  {
    id: 'barranquilla-6-2',
    name: 'Villa San Pedro',
    comuna: '6',
    coordinates: [-74.8200, 10.9440],
    population: 40000,
    households: 10000,
    area: 2.8,
    density: 14286,
    sewerage: 70,
    energy: 80,
    internet: 55,
    education: 59,
    health: 48,
    poverty: 45,
    stratum: 1
  },

  // Comuna 7 - Suroriente
  {
    id: 'barranquilla-7-1',
    name: 'Villa Country',
    comuna: '7',
    coordinates: [-74.8220, 10.9420],
    population: 52000,
    households: 13000,
    area: 3.5,
    density: 14857,
    sewerage: 68,
    energy: 78,
    internet: 52,
    education: 56,
    health: 45,
    poverty: 48,
    stratum: 1
  },
  {
    id: 'barranquilla-7-2',
    name: 'Villa Estrella',
    comuna: '7',
    coordinates: [-74.8240, 10.9400],
    population: 45000,
    households: 11250,
    area: 3.0,
    density: 15000,
    sewerage: 65,
    energy: 75,
    internet: 48,
    education: 53,
    health: 42,
    poverty: 52,
    stratum: 1
  }
];

export interface ComunaData {
  id: string;
  name: string;
  coordinates: [number, number];
  population: number;
  households: number;
  area: number;
  density: number;
  sewerage: number;
  energy: number;
  internet: number;
  education: number;
  health: number;
  poverty: number;
  stratum: number;
  barrios: string[];
}

export const barranquillaComunas: ComunaData[] = [
  {
    id: 'comuna-1',
    name: 'Comuna 1 - Norte',
    coordinates: [-74.7963, 10.9685],
    population: 125000,
    households: 31500,
    area: 8.5,
    density: 14706,
    sewerage: 96,
    energy: 99.7,
    internet: 91.7,
    education: 89.7,
    health: 85,
    poverty: 8.3,
    stratum: 5,
    barrios: ['Riomar', 'Alto Prado', 'Prado']
  },
  {
    id: 'comuna-2',
    name: 'Comuna 2 - Centro',
    coordinates: [-74.8020, 10.9620],
    population: 60000,
    households: 15000,
    area: 3.9,
    density: 15385,
    sewerage: 91,
    energy: 97.5,
    internet: 83.5,
    education: 82.5,
    health: 76.5,
    poverty: 16.5,
    stratum: 3,
    barrios: ['Centro Histórico', 'San Roque']
  },
  {
    id: 'comuna-3',
    name: 'Comuna 3 - Sur',
    coordinates: [-74.8060, 10.9580],
    population: 75000,
    households: 19000,
    area: 4.9,
    density: 15306,
    sewerage: 86.5,
    energy: 95,
    internet: 76.5,
    education: 77.5,
    health: 70,
    poverty: 23.5,
    stratum: 2.5,
    barrios: ['Las Nieves', 'Siape']
  },
  {
    id: 'comuna-4',
    name: 'Comuna 4 - Suroccidente',
    coordinates: [-74.8100, 10.9540],
    population: 83000,
    households: 21000,
    area: 5.7,
    density: 14561,
    sewerage: 81,
    energy: 91,
    internet: 69,
    education: 72,
    health: 63.5,
    poverty: 30,
    stratum: 2,
    barrios: ['La Manga', 'Villa Santos']
  },
  {
    id: 'comuna-5',
    name: 'Comuna 5 - Metropolitana',
    coordinates: [-74.8140, 10.9500],
    population: 77000,
    households: 19300,
    area: 5.3,
    density: 14528,
    sewerage: 76.5,
    energy: 86.5,
    internet: 63.5,
    education: 66.5,
    health: 56.5,
    poverty: 36.5,
    stratum: 2,
    barrios: ['La Playa', 'El Bosque']
  },
  {
    id: 'comuna-6',
    name: 'Comuna 6 - Noroccidente',
    coordinates: [-74.8180, 10.9460],
    population: 88000,
    households: 22000,
    area: 6.1,
    density: 14426,
    sewerage: 71,
    energy: 81,
    internet: 56.5,
    education: 60.5,
    health: 50,
    poverty: 43.5,
    stratum: 1,
    barrios: ['Villa Campestre', 'Villa San Pedro']
  },
  {
    id: 'comuna-7',
    name: 'Comuna 7 - Suroriente',
    coordinates: [-74.8220, 10.9420],
    population: 97000,
    households: 24250,
    area: 6.5,
    density: 14923,
    sewerage: 66.5,
    energy: 76.5,
    internet: 50,
    education: 54.5,
    health: 43.5,
    poverty: 50,
    stratum: 1,
    barrios: ['Villa Country', 'Villa Estrella']
  }
];

// Datos generales de Barranquilla
export const barranquillaGeneral = {
  name: 'Barranquilla',
  coordinates: [-74.7963, 10.9685],
  population: 1250000,
  households: 312500,
  area: 154.2, // km²
  density: 8106, // habitantes/km²
  sewerage: 81.4,
  energy: 89.1,
  internet: 69.3,
  education: 72.4,
  health: 61.1,
  poverty: 29.8,
  stratum: 2.3,
  comunas: 7,
  barrios: 14
};

// Funciones de utilidad
export const getBarrioById = (id: string): BarrioData | undefined => {
  return barranquillaBarrios.find(barrio => barrio.id === id);
};

export const getComunaById = (id: string): ComunaData | undefined => {
  return barranquillaComunas.find(comuna => comunas.id === id);
};

export const getBarriosByComuna = (comunaId: string): BarrioData[] => {
  return barranquillaBarrios.filter(barrio => barrio.comuna === comunasId);
};

export const generateBarranquillaHeatmapData = (barrios: BarrioData[], property: keyof BarrioData) => {
  return barrios.map(barrio => ({
    id: barrio.id,
    lng: barrio.coordinates[0],
    lat: barrio.coordinates[1],
    intensity: barrio[property] as number,
    properties: {
      name: barrio.name,
      comuna: barrio.comuna,
      population: barrio.population,
      households: barrio.households,
      [property]: barrio[property]
    }
  }));
};

export const getBarranquillaColorStops = (property: keyof BarrioData) => {
  const values = barranquillaBarrios.map(barrio => barrio[property] as number);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  
  return [
    [min, '#e5f5e0'],
    [min + range * 0.2, '#a1d99b'],
    [min + range * 0.4, '#74c476'],
    [min + range * 0.6, '#41ab5d'],
    [min + range * 0.8, '#238b45'],
    [max, '#006d2c']
  ] as [number, string][];
};
