# Plan de Implementación: Visualización y Exportación de Datos

## 1. Componentes Necesarios

### 1.1 ChartSection
- Componente principal que se ubicará debajo del Top 10 de barrios
- Incluirá el gráfico y botones de control
- Gestionará el estado del tipo de gráfico seleccionado

### 1.2 ChartTypeSelector
- Modal o panel para seleccionar el tipo de gráfico
- Opciones:
  - Gráfico de Barras
  - Gráfico Circular (Pie)
  - Gráfico de Línea
  - Gráfico de Área

### 1.3 ExportOptions
- Componente para manejar las opciones de exportación
- Funcionalidades:
  - Exportar gráfico como imagen
  - Exportar datos a Excel
  - Exportar datos a CSV

## 2. Bibliotecas a Utilizar

### 2.1 Gráficos
```bash
pnpm add recharts     # Para gráficos interactivos
```

### 2.2 Exportación
```bash
pnpm add xlsx         # Para exportación a Excel
pnpm add file-saver  # Para guardar archivos
pnpm add html2canvas # Para exportar gráficos como imágenes
```

## 3. Estructura de Datos

### 3.1 Modelo de Datos para Gráficos
```typescript
interface ChartData {
  barrio: string;
  matches_count: number;
  total_encuestas: number;
  percentage: number;
}

interface ChartConfig {
  type: 'bar' | 'pie' | 'line' | 'area';
  showPercentage: boolean;
  showAbsolute: boolean;
}
```

## 4. Componentes a Crear

### 4.1 src/components/charts/BarriosChart.tsx
- Componente principal del gráfico
- Utilizará Recharts para la visualización
- Responsivo y con tema oscuro

### 4.2 src/components/charts/ChartControls.tsx
- Controles para:
  - Cambiar tipo de gráfico
  - Toggles para mostrar porcentajes/valores absolutos
  - Botones de exportación

### 4.3 src/components/modals/ChartTypeModal.tsx
- Modal para seleccionar tipo de gráfico
- Vista previa de cada tipo
- Opciones de personalización

### 4.4 src/components/export/ExportPanel.tsx
- Panel de opciones de exportación
- Previsualización de datos a exportar
- Selección de formato

## 5. Funcionalidades de Exportación

### 5.1 Exportar Gráfico
```typescript
// Funciones a implementar
exportAsImage(): Promise<void>;
exportAsCSV(): Promise<void>;
exportAsExcel(): Promise<void>;
```

### 5.2 Exportar Datos
- Formato tabla para Excel/CSV:
  - Barrio
  - Total Encuestas
  - Coincidencias
  - Porcentaje
  - Fecha de exportación

## 6. Estilos y Diseño

### 6.1 Tema del Gráfico
- Mantener consistencia con el tema oscuro actual
- Paleta de colores:
  - Principal: #f6e05e (amarillo actual)
  - Secundarios: tonos de grises
  - Acentos: por definir

### 6.2 Diseño Responsivo
- Adaptable a diferentes anchos
- Controles compactos en móvil
- Tooltips informativos

## 7. Pasos de Implementación

1. **Fase 1: Estructura Base**
   - Crear componentes básicos
   - Implementar el gráfico más simple (barras)
   - Integrar con datos existentes

2. **Fase 2: Tipos de Gráficos**
   - Implementar cambio de tipos
   - Añadir personalizaciones básicas
   - Asegurar transiciones suaves

3. **Fase 3: Exportación**
   - Implementar exportación de imágenes
   - Añadir exportación a Excel/CSV
   - Crear interfaz de exportación

4. **Fase 4: Pulido**
   - Mejorar UX/UI
   - Optimizar rendimiento
   - Añadir animaciones
   - Implementar tests

## 8. Consideraciones Técnicas

### 8.1 Performance
- Usar React.memo para componentes puros
- Implementar lazy loading para modales
- Optimizar re-renders

### 8.2 Accesibilidad
- Asegurar navegación por teclado
- Añadir descripciones para lectores de pantalla
- Contraste adecuado en gráficos

### 8.3 Testing
- Tests unitarios para utils de exportación
- Tests de integración para gráficos
- Tests de accesibilidad

## 9. Siguientes Pasos

1. Crear estructura de carpetas
2. Instalar dependencias
3. Implementar ChartSection básico
4. Integrar con RightSidebarTop10Barrios
5. Implementar selección de gráficos
6. Añadir exportación
7. Pulir UI/UX
