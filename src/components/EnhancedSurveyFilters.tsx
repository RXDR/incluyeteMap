import React, { useState, useEffect } from 'react';
import { useSurveyFunctions } from '@/hooks/useSurveyFunctions';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronRight, 
  X,
  Plus,
  Trash2,
  Loader2,
  RefreshCw,
  Database,
  FileText,
  Users,
  Heart,
  Home,
  GraduationCap,
  Globe,
  Shield,
  Settings
} from 'lucide-react';

// Tipos de datos basados en estructura.json
interface Question {
  id: number;
  text: string;
  category: string;
}

interface Category {
  name: string;
  icon: React.ReactNode;
  color: string;
  questions: Question[];
}

interface FilterCriteria {
  id: string;
  category: string;
  question: string;
  questionId: number;
  responses: string[];
}

interface EnhancedSurveyFiltersProps {
  onFiltersChange: (filters: FilterCriteria[]) => void;
}

// Mapeo de categorías con iconos y colores
const categoryConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  "SALUD": { icon: <Heart className="w-4 h-4" />, color: "bg-red-500" },
  "EDUCACIÓN Y ECONOMÍA": { icon: <GraduationCap className="w-4 h-4" />, color: "bg-blue-500" },
  "SOCIODEMOGRÁFICA": { icon: <Users className="w-4 h-4" />, color: "bg-green-500" },
  "SOCIODEMOGRÁFICO": { icon: <Users className="w-4 h-4" />, color: "bg-green-600" },
  "CONDICIONES DE VIDA": { icon: <Home className="w-4 h-4" />, color: "bg-yellow-500" },
  "TIPO DE DISCAPACIDAD": { icon: <Shield className="w-4 h-4" />, color: "bg-purple-500" },
  "ACCESIBILIDAD": { icon: <Settings className="w-4 h-4" />, color: "bg-indigo-500" },
  "NECESIDADES": { icon: <FileText className="w-4 h-4" />, color: "bg-pink-500" },
  "CUIDADEOR DE PcD": { icon: <Users className="w-4 h-4" />, color: "bg-orange-500" },
  "CERTIFICADO": { icon: <Database className="w-4 h-4" />, color: "bg-teal-500" },
  "NECESIDAD DE CUIDADOR": { icon: <Users className="w-4 h-4" />, color: "bg-cyan-500" }
};

// Preguntas basadas en estructura.json
const surveyQuestions: Question[] = [
  { id: 0, text: "Id", category: "GENERAL" },
  { id: 1, text: "Time", category: "GENERAL" },
  { id: 2, text: "Submitted by", category: "GENERAL" },
  { id: 3, text: "Identificar el rol de la persona que responde la encuesta", category: "GENERAL" },
  { id: 4, text: "¿Qué sexo le fue asignado al nacer?", category: "SOCIODEMOGRÁFICA" },
  { id: 5, text: "¿Cuál es su identidad de género?", category: "SOCIODEMOGRÁFICA" },
  { id: 6, text: "Edad de la persona con discapacidad", category: "SOCIODEMOGRÁFICA" },
  { id: 7, text: "PRIMER NOMBRE", category: "SOCIODEMOGRÁFICA" },
  { id: 8, text: "SEGUNDO NOMBRE", category: "SOCIODEMOGRÁFICA" },
  { id: 9, text: "PRIMER APELLIDO", category: "SOCIODEMOGRÁFICA" },
  { id: 10, text: "SEGUNDO APELLIDO", category: "SOCIODEMOGRÁFICA" },
  { id: 11, text: "Tipo de documento", category: "SOCIODEMOGRÁFICA" },
  { id: 12, text: "Número de documento", category: "SOCIODEMOGRÁFICA" },
  { id: 13, text: "Celular 1", category: "SOCIODEMOGRÁFICA" },
  { id: 14, text: "Celular 2", category: "SOCIODEMOGRÁFICA" },
  { id: 15, text: "Fijo", category: "SOCIODEMOGRÁFICA" },
  { id: 16, text: "Pensar, memorizar", category: "TIPO DE DISCAPACIDAD" },
  { id: 17, text: "Percibir la luz, distinguir objetos", category: "TIPO DE DISCAPACIDAD" },
  { id: 18, text: "Oír, aun con aparatos especiales", category: "TIPO DE DISCAPACIDAD" },
  { id: 19, text: "Hablar y comunicarse", category: "TIPO DE DISCAPACIDAD" },
  { id: 20, text: "Caminar, correr, saltar", category: "TIPO DE DISCAPACIDAD" },
  { id: 21, text: "Relacionarse con las demás personas", category: "TIPO DE DISCAPACIDAD" },
  { id: 22, text: "Llevar, mover, utilizar objetos", category: "TIPO DE DISCAPACIDAD" },
  { id: 23, text: "Cambiar y mantener posiciones", category: "TIPO DE DISCAPACIDAD" },
  { id: 24, text: "Alimentarse, asearse, vestirse", category: "TIPO DE DISCAPACIDAD" },
  { id: 25, text: "¿Se autorreconoce como persona con discapacidad?", category: "TIPO DE DISCAPACIDAD" },
  { id: 26, text: "Incluya su discapacidad en categorías", category: "TIPO DE DISCAPACIDAD" },
  { id: 27, text: "Último nivel educativo alcanzado", category: "EDUCACIÓN Y ECONOMÍA" },
  { id: 28, text: "Área de conocimiento del título", category: "EDUCACIÓN Y ECONOMÍA" },
  { id: 29, text: "Actividad ocupada el último mes", category: "EDUCACIÓN Y ECONOMÍA" },
  { id: 30, text: "Tipo de actividad/oficio con mayor experiencia", category: "EDUCACIÓN Y ECONOMÍA" },
  { id: 31, text: "Estado civil", category: "SOCIODEMOGRÁFICA" },
  { id: 32, text: "¿Tiene hijos? ¿Cuántos?", category: "SOCIODEMOGRÁFICA" },
  { id: 33, text: "Tipo de vivienda actual", category: "CONDICIONES DE VIDA" },
  { id: 34, text: "Adecuaciones para accesibilidad", category: "ACCESIBILIDAD" },
  { id: 35, text: "Servicio de energía", category: "CONDICIONES DE VIDA" },
  { id: 36, text: "Servicio de acueducto", category: "CONDICIONES DE VIDA" },
  { id: 37, text: "Servicio de alcantarillado", category: "CONDICIONES DE VIDA" },
  { id: 38, text: "Servicio de gas", category: "CONDICIONES DE VIDA" },
  { id: 39, text: "Servicio de internet", category: "CONDICIONES DE VIDA" },
  { id: 40, text: "Dispositivos para acceso a internet", category: "CONDICIONES DE VIDA" },
  { id: 41, text: "Medio de transporte más frecuente", category: "CONDICIONES DE VIDA" },
  { id: 42, text: "¿Está afiliado y tiene cobertura de salud?", category: "SALUD" },
  { id: 43, text: "Régimen de salud", category: "SALUD" },
  { id: 44, text: "Ingresos mensuales personales", category: "EDUCACIÓN Y ECONOMÍA" },
  { id: 45, text: "Ingresos totales del hogar", category: "EDUCACIÓN Y ECONOMÍA" },
  { id: 46, text: "Servicios generales de salud", category: "SALUD" },
  { id: 47, text: "Rehabilitación médica", category: "SALUD" },
  { id: 48, text: "Adaptación de la vivienda", category: "ACCESIBILIDAD" },
  { id: 49, text: "Adaptación y accesibilidad del entorno", category: "ACCESIBILIDAD" },
  { id: 50, text: "Servicios educativos", category: "EDUCACIÓN Y ECONOMÍA" },
  { id: 51, text: "Formación profesional", category: "EDUCACIÓN Y ECONOMÍA" },
  { id: 52, text: "Empoderamiento económico", category: "EDUCACIÓN Y ECONOMÍA" },
  { id: 53, text: "Servicios básicos", category: "CONDICIONES DE VIDA" },
  { id: 54, text: "Asesoramiento para personas con discapacidades", category: "NECESIDADES" },
  { id: 55, text: "Asesoramiento para padres y familias", category: "NECESIDADES" },
  { id: 56, text: "Subsidio de transporte", category: "NECESIDADES" },
  { id: 57, text: "Participación en programas vida independiente", category: "NECESIDADES" },
  { id: 58, text: "Formación educativa", category: "NECESIDADES" },
  { id: 59, text: "Ocio, recreación y bienestar", category: "NECESIDADES" },
  { id: 60, text: "Empleabilidad y emprendimiento", category: "NECESIDADES" },
  { id: 61, text: "Ayudas técnicas", category: "NECESIDADES" },
  { id: 62, text: "Mejoramiento de vivienda", category: "NECESIDADES" },
  { id: 63, text: "Ninguna de las anteriores", category: "NECESIDADES" },
  { id: 64, text: "No sabe / No responde", category: "NECESIDADES" },
  { id: 65, text: "Certificado de discapacidad", category: "CERTIFICADO" },
  { id: 66, text: "Asistencia a feria de discapacidad 2024", category: "CERTIFICADO" },
  { id: 67, text: "¿Tiene alguien que lo asista?", category: "NECESIDAD DE CUIDADOR" },
  { id: 68, text: "Rol de la persona que responde", category: "GENERAL" },
  { id: 69, text: "Parentesco con la persona con discapacidad", category: "NECESIDAD DE CUIDADOR" },
  { id: 70, text: "¿Reconoce a la persona como discapacitada?", category: "NECESIDAD DE CUIDADOR" },
  { id: 71, text: "Discapacidad de la persona a su cuidado", category: "NECESIDAD DE CUIDADOR" },
  { id: 72, text: "Sexo del cuidador", category: "CUIDADEOR DE PcD" },
  { id: 73, text: "Edad del cuidador", category: "CUIDADEOR DE PcD" },
  { id: 74, text: "PRIMER NOMBRE (Cuidador)", category: "CUIDADEOR DE PcD" },
  { id: 75, text: "SEGUNDO NOMBRE (Cuidador)", category: "CUIDADEOR DE PcD" },
  { id: 76, text: "PRIMER APELLIDO (Cuidador)", category: "CUIDADEOR DE PcD" },
  { id: 77, text: "SEGUNDO APELLIDO (Cuidador)", category: "CUIDADEOR DE PcD" },
  { id: 78, text: "Tipo de documento del cuidador", category: "CUIDADEOR DE PcD" },
  { id: 79, text: "Número de documento del cuidador", category: "CUIDADEOR DE PcD" },
  { id: 80, text: "Celular 1 (Cuidador)", category: "CUIDADEOR DE PcD" },
  { id: 81, text: "Celular 2 (Cuidador)", category: "CUIDADEOR DE PcD" },
  { id: 82, text: "Fijo (Cuidador)", category: "CUIDADEOR DE PcD" },
  { id: 83, text: "Último nivel educativo del cuidador", category: "CUIDADEOR DE PcD" },
  { id: 84, text: "Área de conocimiento del cuidador", category: "CUIDADEOR DE PcD" },
  { id: 85, text: "Actividad del cuidador último mes", category: "CUIDADEOR DE PcD" },
  { id: 86, text: "Tiempo asistiendo a la persona", category: "CUIDADEOR DE PcD" },
  { id: 87, text: "Días por semana dedicados al cuidado", category: "CUIDADEOR DE PcD" },
  { id: 88, text: "Horas por día dedicadas al cuidado", category: "CUIDADEOR DE PcD" },
  { id: 89, text: "Ingresos mensuales del cuidador", category: "CUIDADEOR DE PcD" },
  { id: 90, text: "¿Recibe remuneración por cuidar?", category: "CUIDADEOR DE PcD" },
  { id: 91, text: "¿Está afiliado a salud? (Cuidador)", category: "CUIDADEOR DE PcD" },
  { id: 92, text: "Régimen de salud del cuidador", category: "CUIDADEOR DE PcD" },
  { id: 93, text: "Subsidio de transporte (Cuidador)", category: "CUIDADEOR DE PcD" },
  { id: 94, text: "Participación programas vida independiente (Cuidador)", category: "CUIDADEOR DE PcD" },
  { id: 95, text: "Formación educativa (Cuidador)", category: "CUIDADEOR DE PcD" },
  { id: 96, text: "Ocio y bienestar (Cuidador)", category: "CUIDADEOR DE PcD" },
  { id: 97, text: "Empleabilidad (Cuidador)", category: "CUIDADEOR DE PcD" },
  { id: 98, text: "Ayudas técnicas (Cuidador)", category: "CUIDADEOR DE PcD" },
  { id: 99, text: "Mejoramiento de vivienda (Cuidador)", category: "CUIDADEOR DE PcD" },
  { id: 100, text: "Ninguna de las anteriores (Cuidador)", category: "CUIDADEOR DE PcD" },
  { id: 101, text: "No sabe / No responde (Cuidador)", category: "CUIDADEOR DE PcD" },
  { id: 102, text: "Dirección", category: "GEOGRÁFICO" },
  { id: 103, text: "NÚMERO 1", category: "GEOGRÁFICO" },
  { id: 104, text: "Letra", category: "GEOGRÁFICO" },
  { id: 105, text: "Sur / Norte / Este", category: "GEOGRÁFICO" },
  { id: 106, text: "NÚMERO 2", category: "GEOGRÁFICO" },
  { id: 107, text: "Letra", category: "GEOGRÁFICO" },
  { id: 108, text: "Sur / Norte / Este", category: "GEOGRÁFICO" },
  { id: 109, text: "NÚMERO 3", category: "GEOGRÁFICO" },
  { id: 110, text: "Urb / Edificio / Bloque / Apto", category: "GEOGRÁFICO" },
  { id: 111, text: "Estrato", category: "GEOGRÁFICO" },
  { id: 112, text: "OBSERVACIONES", category: "GENERAL" },
  { id: 113, text: "Localidad", category: "GEOGRÁFICO" },
  { id: 114, text: "BARRIO", category: "GEOGRÁFICO" },
  { id: 115, text: "Coordx", category: "GEOGRÁFICO" },
  { id: 116, text: "Coordsy", category: "GEOGRÁFICO" },
  { id: 117, text: "Dirección", category: "GEOGRÁFICO" }
];

export default function EnhancedSurveyFilters({ onFiltersChange }: EnhancedSurveyFiltersProps) {
  const {
    loading,
    error,
    getQuestionResponses,
    getQuestionResponseStats,
    getResponsesFromRawData
  } = useSurveyFunctions();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [selectedResponses, setSelectedResponses] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<FilterCriteria[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [availableResponses, setAvailableResponses] = useState<string[]>([]);
  const [responseStats, setResponseStats] = useState<{ response: string; count: number }[]>([]);

  // Agrupar preguntas por categoría
  const categories = surveyQuestions.reduce((acc, question) => {
    if (!acc[question.category]) {
      acc[question.category] = [];
    }
    acc[question.category].push(question);
    return acc;
  }, {} as Record<string, Question[]>);

  // Obtener respuestas únicas usando el hook
  const getUniqueResponses = async (questionId: number): Promise<string[]> => {
    try {
      // Intentar obtener respuestas usando funciones RPC
      const responses = await getQuestionResponses(questionId, 50);
      if (responses.length > 0) {
        console.log(`Respuestas únicas para pregunta ${questionId} (RPC):`, responses);
        return responses;
      }

      // Fallback: obtener desde datos crudos
      const fallbackResponses = await getResponsesFromRawData(questionId, 200);
      console.log(`Respuestas únicas para pregunta ${questionId} (fallback):`, fallbackResponses);
      
      if (fallbackResponses.length === 0) {
        console.warn(`No se encontraron respuestas para la pregunta ${questionId}`);
        return ['Sí', 'No', 'No aplica', 'No sabe / No responde'];
      }
      
      return fallbackResponses;
    } catch (err) {
      console.error('Error obteniendo respuestas:', err);
      return ['Sí', 'No', 'No aplica', 'No sabe / No responde'];
    }
  };

  // Obtener estadísticas de respuestas usando el hook
  const getResponseStats = async (questionId: number): Promise<{ response: string; count: number }[]> => {
    try {
      const stats = await getQuestionResponseStats(questionId, 20);
      return stats.map(item => ({
        response: item.response,
        count: item.count
      }));
    } catch (err) {
      console.error('Error obteniendo estadísticas:', err);
      return [];
    }
  };

  const handleCategorySelect = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
    setSelectedCategory(category);
    setSelectedQuestion(null);
    setSelectedResponses([]);
  };

  const handleQuestionSelect = async (question: Question) => {
    setSelectedQuestion(question);
    
    // Obtener respuestas únicas y estadísticas en paralelo
    const [responses, stats] = await Promise.all([
      getUniqueResponses(question.id),
      getResponseStats(question.id)
    ]);
    
    setAvailableResponses(responses);
    setResponseStats(stats);
    setSelectedResponses([]);
    
    // Log de estadísticas para debug
    console.log(`Estadísticas para pregunta ${question.id}:`, stats);
  };

  const handleResponseToggle = (response: string) => {
    setSelectedResponses(prev => 
      prev.includes(response)
        ? prev.filter(r => r !== response)
        : [...prev, response]
    );
  };

  const addFilter = () => {
    if (!selectedQuestion || selectedResponses.length === 0) return;

    const newFilter: FilterCriteria = {
      id: `${selectedQuestion.category}-${selectedQuestion.id}-${Date.now()}`,
      category: selectedQuestion.category,
      question: selectedQuestion.text,
      questionId: selectedQuestion.id,
      responses: selectedResponses
    };

    const updatedFilters = [...activeFilters, newFilter];
    setActiveFilters(updatedFilters);
    onFiltersChange(updatedFilters);

    setSelectedQuestion(null);
    setSelectedResponses([]);
  };

  const removeFilter = (filterId: string) => {
    const updatedFilters = activeFilters.filter(f => f.id !== filterId);
    setActiveFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    onFiltersChange([]);
  };

  const filteredCategories = Object.keys(categories).filter(category =>
    category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-white">Filtros de Encuesta</h4>
        <div className="flex items-center space-x-2">
          {loading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
          {activeFilters.length > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-gray-400 hover:text-white flex items-center space-x-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* Filtros activos */}
      {activeFilters.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-gray-400">Filtros activos:</div>
          <div className="grid grid-cols-1 gap-2">
            {activeFilters.map(filter => (
              <div key={filter.id} className="bg-gray-700 rounded-lg p-3 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {categoryConfig[filter.category]?.icon}
                    <span className="font-medium text-white">{filter.category}</span>
                  </div>
                  <button
                    onClick={() => removeFilter(filter.id)}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-gray-300 mb-1 text-xs">{filter.question}</div>
                <div className="text-gray-400 text-xs">
                  {filter.responses.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Buscar categoría..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-lg text-sm"
        />
      </div>

      {/* Categorías */}
      <div className="space-y-3">
        {filteredCategories.map(category => {
          const config = categoryConfig[category];
          const isExpanded = expandedCategories.has(category);
          const questions = categories[category];

          return (
            <div key={category} className="space-y-2">
              <button
                onClick={() => handleCategorySelect(category)}
                className={`w-full text-left p-3 rounded-lg transition-colors flex items-center justify-between ${
                  selectedCategory === category 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {config?.icon}
                  <span className="font-medium">{category}</span>
                  <span className="text-xs opacity-75">({questions.length})</span>
                </div>
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {isExpanded && (
                <div className="pl-4 space-y-2">
                  {questions.map(question => (
                    <div key={question.id} className="space-y-2">
                      <button
                        onClick={() => handleQuestionSelect(question)}
                        className={`w-full text-left p-2 rounded text-xs transition-colors flex items-center justify-between ${
                          selectedQuestion?.id === question.id 
                            ? 'bg-green-600 text-white' 
                            : 'text-gray-400 hover:text-white hover:bg-gray-600'
                        }`}
                      >
                        <span className="truncate">{question.text}</span>
                        <span className="text-xs opacity-75">#{question.id}</span>
                      </button>

                      {selectedQuestion?.id === question.id && (
                        <div className="pl-4 space-y-2">
                                                     <div className="text-xs text-gray-400 mb-2">Seleccionar respuestas:</div>
                           <div className="grid grid-cols-1 gap-2">
                             {availableResponses.map(response => {
                               const stats = responseStats.find(s => s.response === response);
                               const count = stats?.count || 0;
                               return (
                                 <label key={response} className="flex items-center justify-between cursor-pointer text-xs p-2 bg-gray-700 rounded">
                                   <div className="flex items-center space-x-2">
                                     <input
                                       type="checkbox"
                                       checked={selectedResponses.includes(response)}
                                       onChange={() => handleResponseToggle(response)}
                                       className="text-green-500 rounded"
                                     />
                                     <span className="text-gray-300">{response}</span>
                                   </div>
                                   <span className="text-gray-400 text-xs bg-gray-600 px-2 py-1 rounded">
                                     {count}
                                   </span>
                                 </label>
                               );
                             })}
                           </div>
                          
                          {selectedResponses.length > 0 && (
                            <button
                              onClick={addFilter}
                              className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white text-xs py-2 px-3 rounded flex items-center justify-center space-x-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Agregar Filtro</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Estadísticas */}
      <div className="text-xs text-gray-400 text-center">
        {activeFilters.length} filtro{activeFilters.length !== 1 ? 's' : ''} activo{activeFilters.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
