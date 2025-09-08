export const HEATMAP_CONFIG = {
  weight: {
    intensity: [
      'interpolate',
      ['linear'],
      ['get', 'intensity'],
      0, 0.1,   // Reducir valor mínimo para mayor claridad
      10, 0.3,  // Ajustar valor medio
      50, 0.7,  // Ajustar valor alto
      100, 1    // Mantener máximo
    ]
  },
  paint: {
    radius: [
      'interpolate',
      ['linear'],
      ['zoom'],
      0, 10,    // Reducir radio base
      9, 20,    // Reducir radio medio
      13, 40    // Reducir radio máximo
    ],
    opacity: 0.9,
    colors: [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0, 'rgba(255,255,204,0)',    // Amarillo claro
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
    0, 0.3,   // Reducir intensidad base
    9, 0.6,   // Ajustar intensidad media
    13, 1     // Mantener intensidad máxima
  ]
};
