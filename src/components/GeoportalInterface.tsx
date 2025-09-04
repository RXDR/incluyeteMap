import { useState, useEffect } from 'react';
import { 
  Search, 
  HelpCircle, 
  MapPin, 
  Layers, 
  Settings, 
  Home, 
  GraduationCap, 
  Heart, 
  MoreHorizontal,
  Lightbulb,
  Globe,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Play
} from 'lucide-react';
import { useMapLibreMap } from '@/hooks/useMapLibreMap';
import { colombiaDepartments, generateHeatmapData, getColorStops, DepartmentData } from '@/data/colombiaData';

interface ThemeOption {
  id: string;
  name: string;
  color: string;
}

interface ServiceOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  subServices?: string[];
}

const themeOptions: ThemeOption[] = [
  { id: 'red', name: 'Rojo', color: 'bg-red-500' },
  { id: 'green', name: 'Verde', color: 'bg-green-500' },
  { id: 'blue', name: 'Azul', color: 'bg-blue-500' },
  { id: 'purple', name: 'Púrpura', color: 'bg-purple-500' },
  { id: 'yellow', name: 'Amarillo', color: 'bg-yellow-500' },
  { id: 'cyan', name: 'Cian', color: 'bg-cyan-500' },
];

const serviceOptions: ServiceOption[] = [
  {
    id: 'viviendas',
    name: 'Viviendas, Hogares y Personas',
    icon: <Home className="w-5 h-5" />,
    subServices: ['Alcantarillado', 'Energía', 'Internet']
  },
  {
    id: 'educacion',
    name: 'Educación y Primera Infancia',
    icon: <GraduationCap className="w-5 h-5" />
  },
  {
    id: 'salud',
    name: 'Salud y Funcionamiento Humano',
    icon: <Heart className="w-5 h-5" />
  },
  {
    id: 'mas',
    name: 'Ver más',
    icon: <MoreHorizontal className="w-5 h-5" />
  }
];

export default function GeoportalInterface() {
  const [selectedTheme, setSelectedTheme] = useState('green');
  const [selectedService, setSelectedService] = useState('sewerage');
  const [is3D, setIs3D] = useState(true);
  const [activeTab, setActiveTab] = useState('perfil');
  const [expandedSections, setExpandedSections] = useState({
    servicios: true,
    visualizacion: true,
    leyenda: true,
    personalizar: false
  });

  // Configuración del mapa
  const mapConfig = {
    center: [-74.006, 4.711] as [number, number],
    zoom: 5,
    pitch: is3D ? 45 : 0,
    style: 'https://demotiles.maplibre.org/style.json'
  };

  const { 
    mapContainer, 
    isReady, 
    styleLoaded,
    error, 
    addHeatmapLayer, 
    removeLayer, 
    set3DMode,
    addChoroplethLayer 
  } = useMapLibreMap(mapConfig);

  // Efecto para manejar el modo 3D
  useEffect(() => {
    if (isReady) {
      set3DMode(is3D);
    }
  }, [is3D, isReady, set3DMode]);

  // Efecto para actualizar los datos del mapa
  useEffect(() => {
    if (!isReady || !styleLoaded) return;

    // Remover capa anterior
    removeLayer('colombia-data');

    // Generar nuevos datos basados en el servicio seleccionado
    const heatmapData = generateHeatmapData(colombiaDepartments, selectedService as keyof DepartmentData);
    const colorStops = getColorStops(selectedService as keyof DepartmentData);

    // Agregar nueva capa
    addHeatmapLayer(heatmapData, 'colombia-data');

  }, [selectedService, isReady, styleLoaded, addHeatmapLayer, removeLayer]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }));
  };

  const getServiceName = (serviceId: string) => {
    const serviceMap: Record<string, string> = {
      'sewerage': 'Alcantarillado',
      'energy': 'Energía',
      'internet': 'Internet',
      'education': 'Educación',
      'health': 'Salud'
    };
    return serviceMap[serviceId] || serviceId;
  };

  const getLegendData = () => {
    const values = colombiaDepartments.map(dept => dept[selectedService as keyof DepartmentData] as number);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    
    return [
      { color: '#006d2c', label: `> ${Math.round(max)}%` },
      { color: '#238b45', label: `${Math.round(max - range * 0.2)} - ${Math.round(max)}%` },
      { color: '#41ab5d', label: `${Math.round(max - range * 0.4)} - ${Math.round(max - range * 0.2)}%` },
      { color: '#74c476', label: `${Math.round(max - range * 0.6)} - ${Math.round(max - range * 0.4)}%` },
      { color: '#a1d99b', label: `${Math.round(max - range * 0.8)} - ${Math.round(max - range * 0.6)}%` },
      { color: '#e5f5e0', label: `${Math.round(min)} - ${Math.round(max - range * 0.8)}%` }
    ];
  };

  if (error) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-red-600 text-center">
          <p>Error al cargar el Geoportal:</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
            <div className="h-screen bg-white text-gray-800 flex flex-col">
      {/* Header */}
      <header className="bg-blue-900 border-b border-blue-700 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xl">InclúyeTE</span>
              <span className="text-blue-100">Geoportal</span>
            </div>
            <span className="text-sm text-blue-200">|</span>
                         <span className="text-sm">Visualizador de Resultados de Encuestas | Análisis Geográfico de Datos de Campo</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                             <input
                 type="text"
                 placeholder="Buscar por barrio, localidad o encuestado"
                 className="bg-blue-800 text-white pl-10 pr-4 py-2 rounded-lg text-sm w-64"
               />
            </div>
          </div>
        </div>
        
        {/* Navigation Bar */}
        <nav className="flex items-center space-x-6 mt-4">
          <button className="flex items-center space-x-2 text-gray-400 hover:text-white">
            <HelpCircle className="w-4 h-4" />
            <span>Ayuda</span>
          </button>
          <button className="flex items-center space-x-2 text-gray-400 hover:text-white">
            <MapPin className="w-4 h-4" />
            <span>Ubicación y periodo</span>
          </button>
          <button className="flex items-center space-x-2 text-white border-b-2 border-red-500 pb-1">
            <Layers className="w-4 h-4" />
            <span>Temas</span>
          </button>
          <button className="flex items-center space-x-2 text-gray-400 hover:text-white">
            <Settings className="w-4 h-4" />
            <span>Herramientas</span>
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-80 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
          <div className="space-y-6">
            {/* Theme Section */}
            <div>
                             <h3 className="text-lg font-semibold mb-3">Tema: Encuestas de Campo | Datos Sociodemográficos</h3>
              <button className="w-full bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-3 text-left">
                <span className="text-sm">Cambiar tema</span>
                <div className="flex space-x-2 mt-2">
                  {themeOptions.map(theme => (
                    <div
                      key={theme.id}
                      className={`w-6 h-6 rounded ${theme.color} cursor-pointer ${
                        selectedTheme === theme.id ? 'ring-2 ring-white' : ''
                      }`}
                      onClick={() => setSelectedTheme(theme.id)}
                    />
                  ))}
                </div>
              </button>
            </div>

            {/* Service Icons */}
            <div className="grid grid-cols-4 gap-4">
              {serviceOptions.map(service => (
                <div key={service.id} className="text-center">
                  <div className="w-12 h-12 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded-lg flex items-center justify-center mx-auto mb-2 cursor-pointer">
                    {service.icon}
                  </div>
                  <span className="text-xs text-center block">{service.name}</span>
                </div>
              ))}
            </div>

            {/* Servicios Públicos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('servicios')}>
                <h4 className="font-semibold">Indicadores de Encuesta</h4>
                {expandedSections.servicios ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
              
              {expandedSections.servicios && (
                <div className="space-y-3 pl-4">
                  <div>
                                         <div className="flex items-center space-x-2 mb-2">
                       <Lightbulb className="w-4 h-4 text-yellow-500" />
                       <span className="text-sm font-medium">Servicios Básicos</span>
                     </div>
                     <div className="space-y-2">
                       <label className="flex items-center space-x-2 cursor-pointer">
                         <input 
                           type="radio" 
                           name="service" 
                           checked={selectedService === 'sewerage'}
                           onChange={() => setSelectedService('sewerage')}
                           className="text-green-500" 
                         />
                         <span className="text-sm">Cobertura de servicios</span>
                       </label>
                     </div>
                   </div>
                   
                   <div className="flex items-center justify-between cursor-pointer">
                     <div className="flex items-center space-x-2">
                       <Lightbulb className="w-4 h-4 text-orange-400" />
                       <span className="text-sm">Condiciones de Vivienda</span>
                     </div>
                     <button 
                       className="text-sm text-gray-400 hover:text-white"
                       onClick={() => setSelectedService('energy')}
                     >
                       Ver datos
                     </button>
                   </div>
                   
                   <div className="flex items-center justify-between cursor-pointer">
                     <div className="flex items-center space-x-2">
                       <Lightbulb className="w-4 h-4 text-blue-400" />
                       <span className="text-sm">Perfil Demográfico</span>
                     </div>
                     <button 
                       className="text-sm text-gray-400 hover:text-white"
                       onClick={() => setSelectedService('internet')}
                     >
                       Ver datos
                     </button>
                   </div>
                </div>
              )}
            </div>

            {/* Visualización */}
            <div className="space-y-4">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('visualizacion')}>
                <h4 className="font-semibold">Visualización</h4>
                {expandedSections.visualizacion ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
              
              {expandedSections.visualizacion && (
                <div className="space-y-3 pl-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                      <Globe className="w-4 h-4" />
                    </div>
                    <span className="text-sm">Mapa</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <span className="text-sm">Resumen</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Central Map Area */}
        <div className="flex-1 relative">
          <div 
            ref={mapContainer} 
            className="w-full h-full rounded-lg overflow-hidden relative"
            style={{ minHeight: '500px' }}
          >
            {(!isReady || !styleLoaded) && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-10">
                <div className="text-gray-600">
                  {!isReady ? 'Cargando mapa...' : 'Cargando estilo del mapa...'}
                </div>
              </div>
            )}
          </div>
          
          {/* 3D Toggle */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-gray-800 rounded-lg p-1 flex">
              <button
                className={`px-3 py-1 rounded text-sm ${is3D ? 'bg-red-600 text-white' : 'text-gray-400'}`}
                onClick={() => setIs3D(true)}
              >
                3D
              </button>
              <button
                className={`px-3 py-1 rounded text-sm ${!is3D ? 'bg-red-600 text-white' : 'text-gray-400'}`}
                onClick={() => setIs3D(false)}
              >
                2D
              </button>
            </div>
          </div>

          {/* Play Button */}
          <div className="absolute top-4 right-16">
            <button className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center hover:bg-yellow-600">
              <Play className="w-5 h-5 ml-1" />
            </button>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto">
          <div className="space-y-6">
            {/* Tabs */}
            <div className="flex border-b border-gray-300">
              <button
                className={`pb-2 px-4 text-sm ${activeTab === 'perfil' ? 'text-blue-900 border-b-2 border-yellow-500' : 'text-gray-600'}`}
                onClick={() => setActiveTab('perfil')}
              >
                Perfil
              </button>
              <button
                className={`pb-2 px-4 text-sm ${activeTab === 'ficha' ? 'text-blue-900 border-b-2 border-yellow-500' : 'text-gray-600'}`}
                onClick={() => setActiveTab('ficha')}
              >
                Ficha
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4">
                             <h3 className="text-lg font-semibold">Resultados de Encuestas de Campo</h3>
               <p className="text-sm text-gray-600">
                 Indicadores de Encuesta • {getServiceName(selectedService)} • Área de Estudio
               </p>

              {/* Tipo de visualización */}
              <div className="space-y-3">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('visualizacion')}>
                  <h4 className="font-semibold text-sm">Tipo de visualización</h4>
                  {expandedSections.visualizacion ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
                
                {expandedSections.visualizacion && (
                  <div className="pl-4">
                    <select className="w-full bg-blue-50 text-blue-900 border border-blue-200 rounded p-2 text-sm">
                      <option>Coropleta</option>
                      <option>Puntos</option>
                      <option>Líneas</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Leyenda */}
              <div className="space-y-3">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('leyenda')}>
                  <h4 className="font-semibold text-sm">Leyenda</h4>
                  {expandedSections.leyenda ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
                
                {expandedSections.leyenda && (
                  <div className="pl-4 space-y-2">
                                         <p className="text-sm font-medium">Resultados de encuesta: {getServiceName(selectedService).toLowerCase()}</p>
                    <div className="space-y-1">
                      {getLegendData().map((item, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div 
                            className="w-4 h-4 rounded" 
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <span className="text-xs">{item.label}</span>
                        </div>
                      ))}
                    </div>
                                         <p className="text-xs text-gray-500 mt-2">Clasificación: Cuantiles | Fuente: Encuestas de Campo</p>
                  </div>
                )}
              </div>

              {/* Personalizar capa */}
              <div className="space-y-3">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('personalizar')}>
                  <h4 className="font-semibold text-sm">Personalizar capa</h4>
                  {expandedSections.personalizar ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </div>

              {/* Fuente */}
              <p className="text-xs text-gray-500">Fuente: Sistema de Encuestas InclúyeTE | Datos de Campo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
