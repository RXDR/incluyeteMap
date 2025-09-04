import React, { useState, useEffect } from 'react';
import { useCombinedFilters } from '../hooks/useCombinedFilters';
import { FilterStats } from '../hooks/useCombinedFilters';

export const CombinedFiltersDemo: React.FC = () => {
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
    getTotalRecordCount
  } = useCombinedFilters();

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedQuestion, setSelectedQuestion] = useState<string>('');
  const [selectedResponse, setSelectedResponse] = useState<string>('');
  const [questionResponses, setQuestionResponses] = useState<any[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // =====================================================
  // EFECTO: Cargar preguntas cuando cambie la categoría
  // =====================================================
  useEffect(() => {
    if (selectedCategory && !questionsByCategory[selectedCategory]) {
      loadQuestionsForCategory(selectedCategory);
    }
  }, [selectedCategory, questionsByCategory, loadQuestionsForCategory]);

  // =====================================================
  // EFECTO: Cargar respuestas cuando cambie la pregunta
  // =====================================================
  useEffect(() => {
    if (selectedQuestion) {
      loadQuestionResponses(selectedQuestion);
    }
  }, [selectedQuestion]);

  // =====================================================
  // EFECTO: Cargar total de registros al montar
  // =====================================================
  useEffect(() => {
    loadTotalRecords();
  }, []);

  // =====================================================
  // FUNCIÓN: Cargar respuestas de una pregunta
  // =====================================================
  const loadQuestionResponses = async (questionId: string) => {
    try {
      const responses = await getQuestionResponses(questionId);
      setQuestionResponses(responses);
    } catch (err) {
      console.error('Error cargando respuestas:', err);
    }
  };

  // =====================================================
  // FUNCIÓN: Cargar total de registros
  // =====================================================
  const loadTotalRecords = async () => {
    try {
      const total = await getTotalRecordCount();
      setTotalRecords(total);
    } catch (err) {
      console.error('Error cargando total de registros:', err);
    }
  };

  // =====================================================
  // FUNCIÓN: Agregar filtro
  // =====================================================
  const handleAddFilter = () => {
    if (selectedQuestion && selectedResponse) {
      addFilter(selectedQuestion, selectedResponse, selectedCategory);
      
      // Limpiar selecciones
      setSelectedQuestion('');
      setSelectedResponse('');
      setQuestionResponses([]);
    }
  };

  // =====================================================
  // FUNCIÓN: Aplicar filtros
  // =====================================================
  const handleApplyFilters = () => {
    if (combinedFilters.length === 0) {
      alert('Agrega al menos un filtro antes de aplicar');
      return;
    }
    console.log('Filtros aplicados automáticamente:', combinedFilters);
  };

  // =====================================================
  // FUNCIÓN: Limpiar filtros
  // =====================================================
  const handleClearFilters = () => {
    clearFilters();
    setSelectedCategory('');
    setSelectedQuestion('');
    setSelectedResponse('');
    setQuestionResponses([]);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🎯 Filtros Combinados - Sistema Optimizado
        </h2>
        <p className="text-gray-600">
          Sistema de filtros que funciona con 40K+ registros usando muestreo inteligente
        </p>
        
        {/* Información del sistema */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-semibold text-blue-800">📊 Total Registros:</span>
              <span className="ml-2 text-blue-600">{totalRecords.toLocaleString()}</span>
            </div>
            <div>
              <span className="font-semibold text-blue-800">🏷️ Categorías:</span>
              <span className="ml-2 text-blue-600">{categories.length}</span>
            </div>
            <div>
              <span className="font-semibold text-blue-800">🔍 Filtros Activos:</span>
              <span className="ml-2 text-blue-600">{combinedFilters.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Estado de carga y errores */}
      {loading && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
            <span className="text-yellow-800">Cargando datos...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <span className="text-red-800">❌ Error: {error}</span>
        </div>
      )}

      {/* Selección de categoría */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">1️⃣ Seleccionar Categoría</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Selección de pregunta */}
      {selectedCategory && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            2️⃣ Seleccionar Pregunta de: <span className="text-blue-600">{selectedCategory}</span>
          </h3>
          
          {!questionsByCategory[selectedCategory] ? (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-gray-600">Cargando preguntas...</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {questionsByCategory[selectedCategory].map((question) => (
                <button
                  key={question.question_id}
                  onClick={() => setSelectedQuestion(question.question_id)}
                  className={`p-3 text-left rounded-lg border transition-colors ${
                    selectedQuestion === question.question_id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-800">
                    Pregunta {question.question_id}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {question.question_text}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {question.response_count} respuestas
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selección de respuesta */}
      {selectedQuestion && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            3️⃣ Seleccionar Respuesta
          </h3>
          
          {questionResponses.length === 0 ? (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-gray-600">Cargando respuestas...</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {questionResponses.map((response, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedResponse(response.response_value)}
                  className={`p-3 text-center rounded-lg border transition-colors ${
                    selectedResponse === response.response_value
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-800">
                    {response.response_value}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {response.response_count} ({response.response_percentage}%)
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Botón para agregar filtro */}
      {selectedQuestion && selectedResponse && (
        <div className="mb-6">
          <button
            onClick={handleAddFilter}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            ➕ Agregar Filtro: {selectedQuestion} = {selectedResponse}
          </button>
        </div>
      )}

      {/* Filtros activos */}
      {combinedFilters.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            🔍 Filtros Activos ({combinedFilters.length})
          </h3>
          
          <div className="space-y-2">
            {combinedFilters.map((filter, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-blue-600 font-medium">
                    Pregunta {filter.questionId}
                  </span>
                  <span className="text-gray-500">=</span>
                  <span className="text-gray-800">{filter.response}</span>
                  {filter.category && (
                    <span className="text-xs text-blue-500 bg-blue-100 px-2 py-1 rounded">
                      {filter.category}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => removeFilter(index)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                >
                  ❌
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex space-x-3">
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔍 Aplicar Filtros
            </button>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              🧹 Limpiar Todo
            </button>
          </div>
        </div>
      )}

      {/* Resultados de filtros */}
      {statsLoading && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
            <span className="text-yellow-800">Aplicando filtros...</span>
          </div>
        </div>
      )}

      {filterStats.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            📊 Resultados: {filterStats.length} Barrios Encontrados
          </h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Barrio
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Localidad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Encuestas
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coincidencias
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Porcentaje
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Intensidad
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filterStats.map((stat, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {stat.barrio}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {stat.localidad}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {stat.total_encuestas}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {stat.matches_count}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {stat.match_percentage}%
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {stat.intensity_score}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Información del sistema */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-700 mb-2">ℹ️ Información del Sistema</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>Muestreo Inteligente:</strong> Procesa solo una muestra representativa para evitar timeouts</li>
          <li>• <strong>Límites Optimizados:</strong> Categorías: sin límite, Preguntas: 1000, Respuestas: 2000, Estadísticas: 5000</li>
          <li>• <strong>Carga Incremental:</strong> Solo carga datos cuando son necesarios</li>
          <li>• <strong>Cache Local:</strong> Evita recargar datos ya obtenidos</li>
        </ul>
      </div>
    </div>
  );
};
