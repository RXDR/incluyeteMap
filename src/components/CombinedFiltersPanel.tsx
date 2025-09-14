import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronRight, Plus, X, Filter, Search, XCircle } from 'lucide-react';
import { useCombinedFilters } from '../hooks/useCombinedFilters';
import { useTheme } from '@/context/ThemeContext';

interface CombinedFiltersPanelProps {
  onFiltersChange: (filters: any[]) => void;
  onStatsChange: (stats: any[]) => void;
}

export default function CombinedFiltersPanel({ onFiltersChange, onStatsChange }: CombinedFiltersPanelProps) {
  const { theme } = useTheme();
  const {
    categories,
    showAllCategories,
    toggleShowAllCategories,
    questionsByCategory,
    loading,
    error,
    combinedFilters,
    filterStats,
    statsLoading,
    loadQuestionsForCategory,
    getQuestionResponses,
    addFilter,
    removeFilter,
    clearFilters,
    applyCombinedFilters
  } = useCombinedFilters();

  // Track last removed filter for radio clearing
  const [lastRemovedQuestionId, setLastRemovedQuestionId] = useState<string | null>(null);

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [questionResponses, setQuestionResponses] = useState<any[]>([]);
  const [responsesLoading, setResponsesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // =====================================================
  // FILTRADO INTELIGENTE DE CATEGORÍAS
  // =====================================================
  const filteredCategories = useMemo(() => {
    if (!searchTerm && !showAllCategories) {
      // Solo mostrar categorías que ya tienen filtros activos o están expandidas
      return categories.filter(cat => {
        const hasActiveFilters = combinedFilters.some(filter => filter.category === cat);
        const isExpanded = expandedCategories.has(cat);
        return hasActiveFilters || isExpanded;
      });
    }
    
    if (searchTerm) {
      // Filtrar por término de búsqueda
      return categories.filter(cat => 
        typeof cat === 'string' &&
        cat.trim().toLowerCase().includes(searchTerm.trim().toLowerCase())
      );
    }
    
    // Mostrar todas las categorías solo cuando se solicite explícitamente
    return categories;
  }, [categories, searchTerm, showAllCategories, combinedFilters, expandedCategories]);

  // =====================================================
  // MANEJO DE CATEGORÍAS EXPANDIDAS
  // =====================================================
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
      // Cargar preguntas cuando se expande
      loadQuestionsForCategory(category);
    }
    setExpandedCategories(newExpanded);
  };

  // =====================================================
  // MANEJO DE PREGUNTAS SELECCIONADAS
  // =====================================================
  const selectQuestion = async (questionId: string, category: string) => {
    if (selectedQuestion === questionId) {
      setSelectedQuestion(null);
      setQuestionResponses([]);
      return;
    }

    setSelectedQuestion(questionId);
    setResponsesLoading(true);
    
    try {
      const responses = await getQuestionResponses(questionId, category);
      setQuestionResponses(responses);
    } catch (err) {
      console.error('Error al cargar respuestas:', err);
    } finally {
      setResponsesLoading(false);
    }
  };

  // =====================================================
  // MANEJO DE FILTROS
  // =====================================================
  const handleAddFilter = (questionId: string, response: string, category?: string) => {
    // Remover cualquier filtro existente para la misma pregunta
    const existingFilterIndex = combinedFilters.findIndex(f => f.questionId === questionId);
    if (existingFilterIndex !== -1) {
      removeFilter(existingFilterIndex);
    }
    
    // Agregar el nuevo filtro
    addFilter(questionId, response, category);
  };

  const handleRemoveFilter = (index: number) => {
    // Get the questionId of the filter being removed
    const filter = combinedFilters[index];
    removeFilter(index);
    if (filter && selectedQuestion === filter.questionId) {
      setSelectedQuestion(null);
      setLastRemovedQuestionId(filter.questionId);
    }
  };

  const handleClearFilters = () => {
    clearFilters();
    setExpandedCategories(new Set());
    setSearchTerm('');
    // Reset showAllCategories to false when clearing all filters
    if (showAllCategories) {
      toggleShowAllCategories();
    }
  };

  // =====================================================
  // LIMPIAR BÚSQUEDA
  // =====================================================
  const clearSearch = () => {
    setSearchTerm('');
    // Reset showAllCategories to false when clearing search
    if (showAllCategories) {
      toggleShowAllCategories();
    }
  };

  // =====================================================
  // SINCRONIZACIÓN CON EL HOOK
  // =====================================================
  // Expose filter names for display/export
  useEffect(() => {
    // Build a readable filter description for each filter (for parent usage)
    combinedFilters.forEach(f => {
      // Valid properties only
      const question = f.questionText || f.questionId;
      const response = f.response;
      const category = f.category ? `(${f.category})` : '';
      // Example: "Pregunta: Respuesta (Categoría)"
      // You can use this logic in parent if needed
    });
    onFiltersChange(combinedFilters);
  }, [combinedFilters, onFiltersChange]);

  useEffect(() => {
    onStatsChange(filterStats);
  }, [filterStats, onStatsChange]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse text-gray-300">🔄 Cargando categorías...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-red-400">❌ Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ===================================================== */}
      {/* HEADER DEL PANEL */}
      {/* ===================================================== */}
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-semibold flex items-center gap-2 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          <Filter className="w-5 h-5" />
          Filtros Combinados
        </h3>
        {combinedFilters.length > 0 && (
          <button
            onClick={handleClearFilters}
            className="text-xs px-2 py-1 rounded text-white bg-red-500 hover:bg-red-600 transition-colors"
          >
            Limpiar Todo
          </button>
        )}
      </div>

      {/* ===================================================== */}
      {/* BARRA DE BÚSQUEDA INTELIGENTE */}
      {/* ===================================================== */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar categorías..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-10 py-2 rounded text-sm border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                theme === 'dark' 
                  ? 'text-gray-400 hover:text-gray-300' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* ===================================================== */}
        {/* CONTROLES DE VISIBILIDAD - ALINEADOS */}
        {/* ===================================================== */}
        <div className="flex items-center justify-between text-xs">
          <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {filteredCategories.length} de {categories.length} categorías
          </span>
          
          <button
            onClick={toggleShowAllCategories}
            className={`underline transition-colors ${
              theme === 'dark' 
                ? 'text-blue-400 hover:text-blue-300' 
                : 'text-blue-600 hover:text-blue-700'
            }`}
          >
            {showAllCategories ? 'Mostrar menos' : 'Mostrar todas'}
          </button>
        </div>
      </div>



      {/* ===================================================== */}
      {/* ESTADO DE CARGA DE ESTADÍSTICAS */}
      {/* ===================================================== */}
      {statsLoading && (
        <div className={`p-2 rounded text-center ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          <div className={`animate-pulse ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>🔄 Aplicando filtros...</div>
        </div>
      )}

      {/* ===================================================== */}
      {/* LISTA DE CATEGORÍAS SIN SCROLL - EXPANSIÓN NATURAL */}
      {/* ===================================================== */}
      <div className="space-y-2">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((category) => (
            <div key={category} className={`border rounded-lg overflow-hidden ${
              theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
            }`}>
              {/* ===================================================== */}
              {/* HEADER DE CATEGORÍA */}
              {/* ===================================================== */}
              <button
                onClick={() => toggleCategory(category)}
                className={`w-full p-3 text-left rounded-t flex items-center justify-between ${
                  theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                }`}
              >
                <span className={`font-medium ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {category.replace("CUIDADEOR", "CUIDADOR")}
                </span>
                <div className="flex items-center gap-2">
                  {questionsByCategory[category] && (
                    <span className={`text-xs px-2 py-1 rounded ${
                      theme === 'dark'
                        ? 'text-gray-400 bg-gray-600'
                        : 'text-gray-600 bg-gray-200'
                    }`}>
                      
                    </span>
                  )}
                  {expandedCategories.has(category) ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* ===================================================== */}
              {/* PREGUNTAS DE LA CATEGORÍA - SIN SCROLL INTERNO */}
              {/* ===================================================== */}
              {expandedCategories.has(category) && (
                <div className={`rounded-b ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                  {questionsByCategory[category] ? (
                    <div className="p-3 space-y-2">
                      {questionsByCategory[category].map((question) => (
                        <div key={question.question_id} className={`border rounded p-2 ${
                          theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
                        }`}>
                          {/* ===================================================== */}
                          {/* PREGUNTA PRINCIPAL */}
                          {/* ===================================================== */}
                          <button
                            onClick={() => selectQuestion(question.question_id, category)}
                            className={`w-full text-left p-2 rounded ${
                              theme === 'dark' 
                                ? 'hover:bg-gray-700' 
                                : 'hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className={`font-medium text-sm ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {question.question_text || `Pregunta ${question.question_id}`}
                                </div>
                                <div className={`text-xs ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  
                                </div>
                              </div>
                              <Plus className={`w-4 h-4 ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`} />
                            </div>
                          </button>

                          {/* ===================================================== */}
                          {/* RESPUESTAS DE LA PREGUNTA - COMPLETAS SIN SCROLL */}
                          {/* ===================================================== */}
                          {selectedQuestion === question.question_id && (
                            <div className={`mt-2 p-2 rounded ${
                              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                            }`}>
                              {responsesLoading ? (
                                <div className={`text-center text-sm ${
                                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                }`}>🔄 Cargando respuestas...</div>
                              ) : (
                                <div className="space-y-1">
                                  {questionResponses.map((response, idx) => {
                                    const isSelected = combinedFilters.some(f => f.questionId === question.question_id && f.response === response.response_value);

                                    // Mostrar label normalizado si existe, si no el valor original
                                    const label = response.labelNormalizado || response.response_value;

                                    return (
                                      <label
                                        key={idx}
                                        className={`w-full text-left p-2 rounded text-sm flex items-center justify-between ${
                                          isSelected
                                            ? 'bg-blue-600 text-white'
                                            : theme === 'dark'
                                            ? 'hover:bg-gray-600 text-white'
                                            : 'hover:bg-gray-200 text-gray-900'
                                        }`}
                                      >
                                        <div className="flex items-center space-x-2">
                                          <input
                                            type="radio"
                                            name={`question-${question.question_id}`}
                                            value={response.response_value}
                                            checked={isSelected}
                                            onChange={() => handleAddFilter(
                                              question.question_id,
                                              response.response_value,
                                              category
                                            )}
                                            className="text-blue-600 border-gray-300 focus:ring-blue-500"
                                          />
                                          <span className={`${isSelected ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{label}</span>
                                        </div>
                                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                          {response.response_count} ({response.response_percentage}%)
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-gray-400">
                      <div className="animate-pulse">🔄 Cargando preguntas...</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center text-gray-400 py-4">
            {searchTerm ? 'No se encontraron categorías que coincidan con la búsqueda' : 'No hay categorías disponibles'}
          </div>
        )}
      </div>

      {/* ===================================================== */}
      {/* INFORMACIÓN DEL SISTEMA */}
      {/* ===================================================== */}
      <div className={`p-3 rounded text-xs ${
        theme === 'dark' 
          ? 'bg-gray-800 text-gray-400' 
          : 'bg-gray-50 text-gray-600'
      }`}>
        <div className="font-medium mb-1">💡 Consejos:</div>
        <div>• Usa la búsqueda para encontrar categorías específicas</div>
        <div>• Solo se muestran categorías activas por defecto</div>
        <div>• Sin scroll: el panel se expande naturalmente</div>
      </div>
    </div>
  );
}
