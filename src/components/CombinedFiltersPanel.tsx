import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronRight, Plus, X, Filter, Search, XCircle } from 'lucide-react';
import { useCombinedFilters } from '../hooks/useCombinedFilters';

interface CombinedFiltersPanelProps {
  onFiltersChange: (filters: any[]) => void;
  onStatsChange: (stats: any[]) => void;
}

export default function CombinedFiltersPanel({ onFiltersChange, onStatsChange }: CombinedFiltersPanelProps) {
  const {
    categories,
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

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [questionResponses, setQuestionResponses] = useState<any[]>([]);
  const [responsesLoading, setResponsesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);

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
        cat.toLowerCase().includes(searchTerm.toLowerCase())
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
    // Bloquear múltiples selecciones dentro de la misma categoría
    if (category && combinedFilters.some(f => f.category === category)) {
      console.warn(`La categoría '${category}' ya tiene un filtro activo. No se pueden agregar más.`);
      return;
    }
    addFilter(questionId, response, category);
  };

  const handleRemoveFilter = (index: number) => {
    removeFilter(index);
  };

  const handleClearFilters = () => {
    clearFilters();
    setExpandedCategories(new Set());
    setSearchTerm('');
    setShowAllCategories(false);
  };

  // =====================================================
  // LIMPIAR BÚSQUEDA
  // =====================================================
  const clearSearch = () => {
    setSearchTerm('');
    setShowAllCategories(false);
  };

  // =====================================================
  // SINCRONIZACIÓN CON EL HOOK
  // =====================================================
  useEffect(() => {
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
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filtros Combinados
        </h3>
        {combinedFilters.length > 0 && (
          <button
            onClick={handleClearFilters}
            className="text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-white"
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
            className="w-full pl-10 pr-10 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* ===================================================== */}
        {/* CONTROLES DE VISIBILIDAD */}
        {/* ===================================================== */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">
            {filteredCategories.length} de {categories.length} categorías
          </span>
          <button
            onClick={() => setShowAllCategories(!showAllCategories)}
            className="text-blue-400 hover:text-blue-300 underline"
          >
            {showAllCategories ? 'Mostrar solo activas' : 'Mostrar todas'}
          </button>
        </div>
      </div>

      {/* ===================================================== */}
      {/* FILTROS ACTIVOS */}
      {/* ===================================================== */}
      {combinedFilters.length > 0 && (
        <div className="p-3 bg-gray-800 rounded">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Filtros Activos ({combinedFilters.length})</h4>
          <div className="space-y-2">
            {combinedFilters.map((filter, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-700 p-2 rounded">
                <span className="text-xs text-white">
                  {filter.category && `${filter.category}: `}
                  Pregunta {filter.questionId} = {filter.response}
                </span>
                <button
                  onClick={() => handleRemoveFilter(index)}
                  className="text-red-300 hover:text-red-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* ESTADO DE CARGA DE ESTADÍSTICAS */}
      {/* ===================================================== */}
      {statsLoading && (
        <div className="p-2 bg-gray-800 rounded text-center">
          <div className="animate-pulse text-gray-300">🔄 Aplicando filtros...</div>
        </div>
      )}

      {/* ===================================================== */}
      {/* LISTA DE CATEGORÍAS SIN SCROLL - EXPANSIÓN NATURAL */}
      {/* ===================================================== */}
      <div className="space-y-2">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((category) => (
            <div key={category} className="border border-gray-600 rounded-lg overflow-hidden">
              {/* ===================================================== */}
              {/* HEADER DE CATEGORÍA */}
              {/* ===================================================== */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full p-3 text-left bg-gray-700 hover:bg-gray-600 rounded-t flex items-center justify-between"
              >
                <span className="font-medium text-white">{category}</span>
                <div className="flex items-center gap-2">
                  {questionsByCategory[category] && (
                    <span className="text-xs text-gray-400 bg-gray-600 px-2 py-1 rounded">
                      {questionsByCategory[category].length} preguntas
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
                <div className="bg-gray-800 rounded-b">
                  {questionsByCategory[category] ? (
                    <div className="p-3 space-y-2">
                      {questionsByCategory[category].map((question) => (
                        <div key={question.question_id} className="border border-gray-600 rounded p-2">
                          {/* ===================================================== */}
                          {/* PREGUNTA PRINCIPAL */}
                          {/* ===================================================== */}
                          <button
                            onClick={() => selectQuestion(question.question_id, category)}
                            className="w-full text-left hover:bg-gray-700 p-2 rounded"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-sm text-white">
                                  {question.question_text || `Pregunta ${question.question_id}`}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {question.response_count} respuestas
                                </div>
                              </div>
                              <Plus className="w-4 h-4 text-gray-400" />
                            </div>
                          </button>

                          {/* ===================================================== */}
                          {/* RESPUESTAS DE LA PREGUNTA - COMPLETAS SIN SCROLL */}
                          {/* ===================================================== */}
                          {selectedQuestion === question.question_id && (
                            <div className="mt-2 p-2 bg-gray-700 rounded">
                              {responsesLoading ? (
                                <div className="text-center text-sm text-gray-300">🔄 Cargando respuestas...</div>
                              ) : (
                                <div className="space-y-1">
                                  {questionResponses.map((response, idx) => {
                                    const isCategoryBlocked = category && combinedFilters.some(f => f.category === category);
                                    const isSelected = combinedFilters.some(f => f.questionId === question.question_id && f.response === response.response_value);

                                    return (
                                      <button
                                        key={idx}
                                        onClick={() => handleAddFilter(
                                          question.question_id,
                                          response.response_value,
                                          category
                                        )}
                                        disabled={isCategoryBlocked && !isSelected}
                                        className={`w-full text-left p-2 rounded text-sm flex items-center justify-between ${
                                          isSelected
                                            ? 'bg-blue-600 text-white'
                                            : isCategoryBlocked
                                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                            : 'hover:bg-gray-600'
                                        }`}
                                      >
                                        <span className="text-white">{response.response_value}</span>
                                        <span className="text-xs text-gray-400">
                                          {response.response_count} ({response.response_percentage}%)
                                        </span>
                                      </button>
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
      <div className="p-3 bg-gray-800 rounded text-xs text-gray-400">
        <div className="font-medium mb-1">💡 Consejos:</div>
        <div>• Usa la búsqueda para encontrar categorías específicas</div>
        <div>• Solo se muestran categorías activas por defecto</div>
        <div>• Sin scroll: el panel se expande naturalmente</div>
      </div>
    </div>
  );
}
