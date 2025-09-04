import React, { useState, useEffect } from 'react';
import { useSurveyData } from '@/hooks/useSurveyData';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronRight, 
  Check, 
  X,
  Plus,
  Trash2,
  Loader2,
  RefreshCw
} from 'lucide-react';

// Tipos de datos
interface Question {
  question_text: string;
  response_type: string;
  response_value: string;
}

interface Category {
  [questionId: string]: Question;
}

interface SurveyData {
  [categoryName: string]: Category;
}

interface FilterCriteria {
  id: string;
  category: string;
  question: string;
  questionId: string;
  responses: string[];
}

interface AdvancedFiltersProps {
  onFiltersChange: (filters: FilterCriteria[]) => void;
}

// Datos de ejemplo basados en dataresponseindexed.json
const sampleSurveyData: SurveyData = {
  "SALUD": {
    "43": {
      "question_text": "Pregunta 43",
      "response_type": "text",
      "response_value": "Subsidiado / SISBÉN"
    },
    "44": {
      "question_text": "Pregunta 44",
      "response_type": "text",
      "response_value": "1 - De $1 a $300.000"
    },
    "45": {
      "question_text": "Pregunta 45",
      "response_type": "text",
      "response_value": "5 - De $1.200.001 a $1.500.000"
    }
  },
  "GENERAL": {
    "0": {
      "question_text": "Pregunta 0",
      "response_type": "numeric",
      "response_value": "532056"
    },
    "1": {
      "question_text": "Pregunta 1",
      "response_type": "text",
      "response_value": "2024-07-20T16:08:59.000000Z"
    }
  },
  "GEOGRÁFICO": {
    "111": {
      "question_text": "Pregunta 111",
      "response_type": "numeric",
      "response_value": "1"
    },
    "113": {
      "question_text": "Pregunta 113",
      "response_type": "text",
      "response_value": "Metropolitana"
    }
  },
  "NECESIDADES": {
    "65": {
      "question_text": "Pregunta 65",
      "response_type": "boolean",
      "response_value": "No"
    },
    "66": {
      "question_text": "Pregunta 66",
      "response_type": "boolean",
      "response_value": "No"
    },
    "67": {
      "question_text": "Pregunta 67",
      "response_type": "boolean",
      "response_value": "Si"
    }
  },
  "ACCESIBILIDAD": {
    "55": {
      "question_text": "Pregunta 55",
      "response_type": "text",
      "response_value": "3-Regular"
    },
    "56": {
      "question_text": "Pregunta 56",
      "response_type": "text",
      "response_value": "1 - Subsidio de transporte"
    }
  },
  "CUIDADOR DE PcD": {
    "102": {
      "question_text": "Pregunta 102",
      "response_type": "text",
      "response_value": "CL"
    },
    "103": {
      "question_text": "Pregunta 103",
      "response_type": "numeric",
      "response_value": "50"
    }
  },
  "SOCIODEMOGRÁFICA": {
    "4": {
      "question_text": "Pregunta 4",
      "response_type": "text",
      "response_value": "Femenino"
    },
    "5": {
      "question_text": "Pregunta 5",
      "response_type": "text",
      "response_value": "Mujer"
    },
    "6": {
      "question_text": "Pregunta 6",
      "response_type": "text",
      "response_value": "Mayor de 65 años"
    }
  },
  "TIPO DE DISCAPACIDAD": {
    "16": {
      "question_text": "Pregunta 16",
      "response_type": "text",
      "response_value": "No Tiene dificultad"
    },
    "17": {
      "question_text": "Pregunta 17",
      "response_type": "text",
      "response_value": "Es adquirida"
    }
  },
  "EDUCACIÓN Y ECONOMÍA": {
    "26": {
      "question_text": "Pregunta 26",
      "response_type": "text",
      "response_value": "7 - Múltiple"
    },
    "27": {
      "question_text": "Pregunta 27",
      "response_type": "text",
      "response_value": "Primaria incompleta"
    }
  }
};

export default function AdvancedFilters({ onFiltersChange }: AdvancedFiltersProps) {
  const { surveyData, loading, error, refresh } = useSurveyData();
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedQuestion, setSelectedQuestion] = useState<string>('');
  const [selectedResponses, setSelectedResponses] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<FilterCriteria[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Obtener categorías únicas
  const categories = surveyData ? Object.keys(surveyData) : [];

  // Obtener preguntas de una categoría
  const getQuestionsForCategory = (category: string) => {
    if (!surveyData) return [];
    return Object.entries(surveyData[category] || {}).map(([id, question]) => ({
      id,
      ...question
    }));
  };

  // Obtener respuestas únicas para una pregunta
  const getUniqueResponsesForQuestion = (category: string, questionId: string) => {
    if (!surveyData) return [];
    const responses = new Set<string>();
    Object.values(surveyData[category] || {}).forEach(question => {
      if (question.response_value) {
        responses.add(question.response_value);
      }
    });
    return Array.from(responses).sort();
  };

  // Manejar selección de categoría
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSelectedQuestion('');
    setSelectedResponses([]);
    setExpandedSections(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Manejar selección de pregunta
  const handleQuestionSelect = (questionId: string) => {
    setSelectedQuestion(questionId);
    setSelectedResponses([]);
    setExpandedSections(prev => ({
      ...prev,
      [`${selectedCategory}-${questionId}`]: !prev[`${selectedCategory}-${questionId}`]
    }));
  };

  // Manejar selección de respuestas
  const handleResponseToggle = (response: string) => {
    setSelectedResponses(prev => 
      prev.includes(response)
        ? prev.filter(r => r !== response)
        : [...prev, response]
    );
  };

  // Agregar filtro
  const addFilter = () => {
    if (!selectedCategory || !selectedQuestion || selectedResponses.length === 0 || !surveyData) {
      return;
    }

    const question = surveyData[selectedCategory][selectedQuestion];
    const newFilter: FilterCriteria = {
      id: `${selectedCategory}-${selectedQuestion}-${Date.now()}`,
      category: selectedCategory,
      question: question.question_text,
      questionId: selectedQuestion,
      responses: selectedResponses
    };

    const updatedFilters = [...activeFilters, newFilter];
    setActiveFilters(updatedFilters);
    onFiltersChange(updatedFilters);

    // Resetear selecciones
    setSelectedQuestion('');
    setSelectedResponses([]);
  };

  // Remover filtro
  const removeFilter = (filterId: string) => {
    const updatedFilters = activeFilters.filter(f => f.id !== filterId);
    setActiveFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  // Limpiar todos los filtros
  const clearAllFilters = () => {
    setActiveFilters([]);
    onFiltersChange([]);
  };

  // Filtrar categorías por búsqueda
  const filteredCategories = categories.filter(category =>
    category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-white">Filtros Avanzados</h4>
        <div className="flex items-center space-x-2">
          {loading && (
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          )}
          <button
            onClick={refresh}
            className="text-xs text-gray-400 hover:text-white flex items-center space-x-1"
            disabled={loading}
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
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
          {activeFilters.map(filter => (
            <div key={filter.id} className="bg-gray-700 rounded-lg p-2 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-white">{filter.category}</span>
                <button
                  onClick={() => removeFilter(filter.id)}
                  className="text-gray-400 hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="text-gray-300 mb-1">{filter.question}</div>
              <div className="text-gray-400">
                {filter.responses.join(', ')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estado de carga o error */}
      {loading && (
        <div className="text-center py-4">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-400">Cargando datos de encuestas...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 text-sm">
          <p className="text-red-400 mb-2">Error al cargar datos:</p>
          <p className="text-gray-300 text-xs">{error}</p>
          <button
            onClick={refresh}
            className="mt-2 text-xs text-red-400 hover:text-red-300"
          >
            Intentar de nuevo
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Búsqueda de categorías */}
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

      {/* Lista de categorías */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {filteredCategories.map(category => (
          <div key={category} className="space-y-2">
            <button
              onClick={() => handleCategorySelect(category)}
              className={`w-full text-left p-2 rounded text-sm transition-colors flex items-center justify-between ${
                selectedCategory === category 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              <span>{category}</span>
              {expandedSections[category] ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {/* Preguntas de la categoría */}
            {expandedSections[category] && (
              <div className="pl-4 space-y-1">
                {getQuestionsForCategory(category).map(question => (
                  <div key={question.id} className="space-y-1">
                    <button
                      onClick={() => handleQuestionSelect(question.id)}
                      className={`w-full text-left p-2 rounded text-xs transition-colors flex items-center justify-between ${
                        selectedQuestion === question.id 
                          ? 'bg-green-600 text-white' 
                          : 'text-gray-400 hover:text-white hover:bg-gray-600'
                      }`}
                    >
                      <span className="truncate">{question.question_text}</span>
                      {expandedSections[`${category}-${question.id}`] ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </button>

                    {/* Respuestas de la pregunta */}
                    {expandedSections[`${category}-${question.id}`] && (
                      <div className="pl-4 space-y-1">
                        {getUniqueResponsesForQuestion(category, question.id).map(response => (
                          <label key={response} className="flex items-center space-x-2 cursor-pointer text-xs">
                            <input
                              type="checkbox"
                              checked={selectedResponses.includes(response)}
                              onChange={() => handleResponseToggle(response)}
                              className="text-green-500 rounded"
                            />
                            <span className="text-gray-300 truncate">{response}</span>
                          </label>
                        ))}
                        
                        {/* Botón para agregar filtro */}
                        {selectedResponses.length > 0 && (
                          <button
                            onClick={addFilter}
                            className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white text-xs py-1 px-2 rounded flex items-center justify-center space-x-1"
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
        ))}
      </div>

          {/* Estadísticas */}
          <div className="text-xs text-gray-400">
            {activeFilters.length} filtro{activeFilters.length !== 1 ? 's' : ''} activo{activeFilters.length !== 1 ? 's' : ''}
          </div>
        </>
      )}
    </div>
  );
}
