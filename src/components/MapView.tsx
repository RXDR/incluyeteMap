import { useMapLibreMap } from '@/hooks/useMapLibreMap';

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  pitch?: number;
  style?: string;
  statsLoading?: boolean; // Nuevo: para mostrar loader mientras se cargan los datos
}

export default function MapView({ 
  center = [-74.006, 4.711], 
  zoom = 5, 
  pitch = 45,
  style = 'https://demotiles.maplibre.org/style.json',
  statsLoading = false
}: MapViewProps) {
  const { mapContainer, isReady, error } = useMapLibreMap({
    center,
    zoom,
    pitch,
    style
  });

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-red-600 text-center">
          <p>Error al cargar el mapa:</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapContainer} 
      className="w-full h-full rounded-lg overflow-hidden relative"
      style={{ minHeight: '500px' }}
    >
      {(!isReady || statsLoading) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-10">
          <div className="text-gray-600 animate-pulse">
            {statsLoading ? 'Aplicando filtro...' : 'Cargando mapa...'}
          </div>
        </div>
      )}
    </div>
  );
}
