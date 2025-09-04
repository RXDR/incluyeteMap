import { colombiaDepartments, DepartmentData } from '@/data/colombiaData';

export interface GeoportalStats {
  totalDepartments: number;
  totalPopulation: number;
  totalHouseholds: number;
  averageSewerage: number;
  averageEnergy: number;
  averageInternet: number;
  averageEducation: number;
  averageHealth: number;
}

export interface DepartmentFilter {
  minPopulation?: number;
  maxPopulation?: number;
  minSewerage?: number;
  maxSewerage?: number;
  minEnergy?: number;
  maxEnergy?: number;
  minInternet?: number;
  maxInternet?: number;
  minEducation?: number;
  maxEducation?: number;
  minHealth?: number;
  maxHealth?: number;
}

export class GeoportalService {
  /**
   * Obtiene estadísticas generales de Colombia
   */
  static getStats(): GeoportalStats {
    const totalDepartments = colombiaDepartments.length;
    const totalPopulation = colombiaDepartments.reduce((sum, dept) => sum + dept.population, 0);
    const totalHouseholds = colombiaDepartments.reduce((sum, dept) => sum + dept.households, 0);
    
    const averageSewerage = colombiaDepartments.reduce((sum, dept) => sum + dept.sewerage, 0) / totalDepartments;
    const averageEnergy = colombiaDepartments.reduce((sum, dept) => sum + dept.energy, 0) / totalDepartments;
    const averageInternet = colombiaDepartments.reduce((sum, dept) => sum + dept.internet, 0) / totalDepartments;
    const averageEducation = colombiaDepartments.reduce((sum, dept) => sum + dept.education, 0) / totalDepartments;
    const averageHealth = colombiaDepartments.reduce((sum, dept) => sum + dept.health, 0) / totalDepartments;

    return {
      totalDepartments,
      totalPopulation,
      totalHouseholds,
      averageSewerage: Math.round(averageSewerage * 100) / 100,
      averageEnergy: Math.round(averageEnergy * 100) / 100,
      averageInternet: Math.round(averageInternet * 100) / 100,
      averageEducation: Math.round(averageEducation * 100) / 100,
      averageHealth: Math.round(averageHealth * 100) / 100,
    };
  }

  /**
   * Obtiene todos los departamentos
   */
  static getDepartments(): DepartmentData[] {
    return colombiaDepartments;
  }

  /**
   * Obtiene un departamento por ID
   */
  static getDepartmentById(id: string): DepartmentData | undefined {
    return colombiaDepartments.find(dept => dept.id === id);
  }

  /**
   * Filtra departamentos según criterios
   */
  static filterDepartments(filters: DepartmentFilter): DepartmentData[] {
    return colombiaDepartments.filter(dept => {
      if (filters.minPopulation && dept.population < filters.minPopulation) return false;
      if (filters.maxPopulation && dept.population > filters.maxPopulation) return false;
      if (filters.minSewerage && dept.sewerage < filters.minSewerage) return false;
      if (filters.maxSewerage && dept.sewerage > filters.maxSewerage) return false;
      if (filters.minEnergy && dept.energy < filters.minEnergy) return false;
      if (filters.maxEnergy && dept.energy > filters.maxEnergy) return false;
      if (filters.minInternet && dept.internet < filters.minInternet) return false;
      if (filters.maxInternet && dept.internet > filters.maxInternet) return false;
      if (filters.minEducation && dept.education < filters.minEducation) return false;
      if (filters.maxEducation && dept.education > filters.maxEducation) return false;
      if (filters.minHealth && dept.health < filters.minHealth) return false;
      if (filters.maxHealth && dept.health > filters.maxHealth) return false;
      return true;
    });
  }

  /**
   * Obtiene los mejores departamentos por métrica
   */
  static getTopDepartments(metric: keyof DepartmentData, limit: number = 5): DepartmentData[] {
    return [...colombiaDepartments]
      .sort((a, b) => (b[metric] as number) - (a[metric] as number))
      .slice(0, limit);
  }

  /**
   * Obtiene los peores departamentos por métrica
   */
  static getBottomDepartments(metric: keyof DepartmentData, limit: number = 5): DepartmentData[] {
    return [...colombiaDepartments]
      .sort((a, b) => (a[metric] as number) - (b[metric] as number))
      .slice(0, limit);
  }

  /**
   * Calcula el rango de valores para una métrica
   */
  static getMetricRange(metric: keyof DepartmentData): { min: number; max: number; avg: number } {
    const values = colombiaDepartments.map(dept => dept[metric] as number);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;

    return {
      min,
      max,
      avg: Math.round(avg * 100) / 100
    };
  }

  /**
   * Obtiene datos para visualización en mapa
   */
  static getMapData(metric: keyof DepartmentData) {
    return colombiaDepartments.map(dept => ({
      id: dept.id,
      name: dept.name,
      coordinates: dept.coordinates,
      value: dept[metric] as number,
      population: dept.population,
      households: dept.households
    }));
  }

  /**
   * Simula datos de encuestas para un departamento
   */
  static getSurveyData(departmentId: string) {
    const dept = this.getDepartmentById(departmentId);
    if (!dept) return [];

    // Simular datos de encuestas basados en las métricas del departamento
    const surveys = [];
    const surveyCount = Math.floor(dept.population / 10000); // 1 encuesta por cada 10k habitantes

    for (let i = 0; i < Math.min(surveyCount, 100); i++) {
      surveys.push({
        id: `${departmentId}-${i}`,
        department: dept.name,
        coordinates: [
          dept.coordinates[0] + (Math.random() - 0.5) * 0.1, // Variación en longitud
          dept.coordinates[1] + (Math.random() - 0.5) * 0.1  // Variación en latitud
        ],
        sewerage: Math.random() < dept.sewerage / 100,
        energy: Math.random() < dept.energy / 100,
        internet: Math.random() < dept.internet / 100,
        education: Math.random() < dept.education / 100,
        health: Math.random() < dept.health / 100,
        population: Math.floor(Math.random() * 1000) + 100,
        households: Math.floor(Math.random() * 200) + 50
      });
    }

    return surveys;
  }

  /**
   * Obtiene datos para análisis de correlación
   */
  static getCorrelationData() {
    const metrics = ['sewerage', 'energy', 'internet', 'education', 'health'] as const;
    const correlations: Record<string, number> = {};

    // Calcular correlaciones entre métricas
    for (let i = 0; i < metrics.length; i++) {
      for (let j = i + 1; j < metrics.length; j++) {
        const metric1 = metrics[i];
        const metric2 = metrics[j];
        
        const values1 = colombiaDepartments.map(dept => dept[metric1]);
        const values2 = colombiaDepartments.map(dept => dept[metric2]);
        
        const correlation = this.calculateCorrelation(values1, values2);
        correlations[`${metric1}-${metric2}`] = correlation;
      }
    }

    return correlations;
  }

  /**
   * Calcula la correlación de Pearson entre dos arrays
   */
  private static calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }
}
