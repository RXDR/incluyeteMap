export interface DepartmentData {
  id: string;
  name: string;
  coordinates: [number, number];
  population: number;
  households: number;
  sewerage: number;
  energy: number;
  internet: number;
  education: number;
  health: number;
}

export const colombiaDepartments: DepartmentData[] = [
  {
    id: 'antioquia',
    name: 'Antioquia',
    coordinates: [-75.5636, 6.2442],
    population: 6470000,
    households: 1800000,
    sewerage: 85,
    energy: 92,
    internet: 78,
    education: 88,
    health: 82
  },
  {
    id: 'cundinamarca',
    name: 'Cundinamarca',
    coordinates: [-74.0762, 4.7110],
    population: 3200000,
    households: 850000,
    sewerage: 90,
    energy: 95,
    internet: 85,
    education: 92,
    health: 88
  },
  {
    id: 'valle',
    name: 'Valle del Cauca',
    coordinates: [-76.5225, 3.4372],
    population: 4500000,
    households: 1200000,
    sewerage: 88,
    energy: 94,
    internet: 82,
    education: 90,
    health: 85
  },
  {
    id: 'atlantico',
    name: 'Atlántico',
    coordinates: [-74.7963, 10.9685],
    population: 2500000,
    households: 650000,
    sewerage: 82,
    energy: 89,
    internet: 75,
    education: 85,
    health: 80
  },
  {
    id: 'santander',
    name: 'Santander',
    coordinates: [-73.1252, 7.1257],
    population: 2200000,
    households: 580000,
    sewerage: 80,
    energy: 87,
    internet: 72,
    education: 83,
    health: 78
  },
  {
    id: 'boyaca',
    name: 'Boyacá',
    coordinates: [-73.3616, 5.5353],
    population: 1200000,
    households: 320000,
    sewerage: 75,
    energy: 82,
    internet: 65,
    education: 78,
    health: 75
  },
  {
    id: 'nariño',
    name: 'Nariño',
    coordinates: [-77.2789, 1.2083],
    population: 1500000,
    households: 400000,
    sewerage: 70,
    energy: 78,
    internet: 60,
    education: 75,
    health: 72
  },
  {
    id: 'cauca',
    name: 'Cauca',
    coordinates: [-76.6292, 2.4389],
    population: 1400000,
    households: 370000,
    sewerage: 68,
    energy: 76,
    internet: 58,
    education: 73,
    health: 70
  },
  {
    id: 'magdalena',
    name: 'Magdalena',
    coordinates: [-74.1990, 11.2404],
    population: 1300000,
    households: 340000,
    sewerage: 72,
    energy: 80,
    internet: 62,
    education: 76,
    health: 74
  },
  {
    id: 'bolivar',
    name: 'Bolívar',
    coordinates: [-75.5144, 10.3997],
    population: 2000000,
    households: 520000,
    sewerage: 78,
    energy: 85,
    internet: 68,
    education: 80,
    health: 77
  }
];

export const generateHeatmapData = (departments: DepartmentData[], property: keyof DepartmentData) => {
  return departments.map(dept => ({
    id: dept.id,
    lng: dept.coordinates[0],
    lat: dept.coordinates[1],
    intensity: dept[property] as number,
    properties: {
      name: dept.name,
      population: dept.population,
      households: dept.households,
      [property]: dept[property]
    }
  }));
};

export const getColorStops = (property: keyof DepartmentData) => {
  const values = colombiaDepartments.map(dept => dept[property] as number);
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
