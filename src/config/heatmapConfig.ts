export const HEATMAP_CONFIG = {
  weight: {
    intensity: [
      'interpolate',
      ['linear'],
      ['get', 'intensity'],
      0, 0.3,   // Aumentar valor mínimo
      50, 0.7,  // Aumentar valor medio
      100, 1    // Mantener máximo
    ]
  },
  paint: {
    radius: [
      'interpolate',
      ['linear'],
      ['zoom'],
      0, 15,    // Radio base más grande
      9, 30,    // Radio medio más grande
      13, 50    // Radio máximo más grande
    ],
    opacity: 0.9,
    colors: [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0, 'rgba(65,182,196,0)',    // Cian claro
      0.2, 'rgba(161,218,180,1)', // Verde claro
      0.4, 'rgba(65,182,196,1)',  // Cian
      0.6, 'rgba(44,127,184,1)',  // Azul medio
      0.8, 'rgba(37,52,148,1)',   // Azul oscuro
      1, 'rgba(8,29,88,1)'        // Azul muy oscuro
    ]
  },
  intensity: [
    'interpolate',
    ['linear'],
    ['zoom'],
    0, 0.5,   // Intensidad base más alta
    9, 0.8,   // Intensidad media más alta
    13, 1     // Intensidad máxima
  ]
};
