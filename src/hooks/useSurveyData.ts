import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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

interface UseSurveyDataReturn {
  surveyData: SurveyData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useSurveyData(): UseSurveyDataReturn {
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSurveyData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Intentar obtener datos de la tabla survey_responses_indexed
      const { data: indexedData, error: indexedError } = await supabase
        .from('survey_responses_indexed')
        .select('questions_responses')
        .limit(100); // Limitar para evitar sobrecarga

      if (indexedError) {
        console.warn('Error al obtener datos indexados:', indexedError);
        
        // Fallback: intentar obtener datos de la tabla temp_excel_import
        const { data: tempData, error: tempError } = await supabase
          .from('temp_excel_import')
          .select('raw_data')
          .limit(100);

        if (tempError) {
          throw new Error(`Error al obtener datos: ${tempError.message}`);
        }

        if (tempData && tempData.length > 0) {
          // Procesar datos de temp_excel_import
          const processedData = processTempData(tempData);
          setSurveyData(processedData);
        } else {
          // Usar datos de ejemplo si no hay datos en la base
          setSurveyData(getSampleData());
        }
      } else if (indexedData && indexedData.length > 0) {
        // Procesar datos indexados
        const processedData = processIndexedData(indexedData);
        setSurveyData(processedData);
      } else {
        // Usar datos de ejemplo si no hay datos
        setSurveyData(getSampleData());
      }
    } catch (err) {
      console.error('Error al cargar datos de encuestas:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      // Fallback a datos de ejemplo
      setSurveyData(getSampleData());
    } finally {
      setLoading(false);
    }
  };

  const processIndexedData = (data: any[]): SurveyData => {
    const processed: SurveyData = {};
    
    data.forEach(record => {
      if (record.questions_responses) {
        try {
          const responses = typeof record.questions_responses === 'string' 
            ? JSON.parse(record.questions_responses)
            : record.questions_responses;
          
          Object.entries(responses).forEach(([category, questions]: [string, any]) => {
            if (!processed[category]) {
              processed[category] = {};
            }
            
            Object.entries(questions).forEach(([questionId, questionData]: [string, any]) => {
              processed[category][questionId] = {
                question_text: questionData.question_text || `Pregunta ${questionId}`,
                response_type: questionData.response_type || 'text',
                response_value: questionData.response_value || ''
              };
            });
          });
        } catch (err) {
          console.warn('Error al procesar datos indexados:', err);
        }
      }
    });

    return processed;
  };

  const processTempData = (data: any[]): SurveyData => {
    const processed: SurveyData = {};
    
    data.forEach(record => {
      if (record.raw_data) {
        try {
          const rawData = typeof record.raw_data === 'string' 
            ? JSON.parse(record.raw_data)
            : record.raw_data;
          
          // Procesar datos de Excel según la estructura conocida
          if (rawData && typeof rawData === 'object') {
            Object.entries(rawData).forEach(([key, value]: [string, any]) => {
              // Extraer categoría y pregunta del key
              const parts = key.split('_');
              if (parts.length >= 2) {
                const category = parts[0];
                const questionId = parts[1];
                
                if (!processed[category]) {
                  processed[category] = {};
                }
                
                processed[category][questionId] = {
                  question_text: `Pregunta ${questionId}`,
                  response_type: typeof value === 'number' ? 'numeric' : 'text',
                  response_value: String(value)
                };
              }
            });
          }
        } catch (err) {
          console.warn('Error al procesar datos temporales:', err);
        }
      }
    });

    return processed;
  };

  const getSampleData = (): SurveyData => {
    return {
      "SALUD": {
        "43": {
          "question_text": "Tipo de afiliación a salud",
          "response_type": "text",
          "response_value": "Subsidiado / SISBÉN"
        },
        "44": {
          "question_text": "Rango de ingresos",
          "response_type": "text",
          "response_value": "1 - De $1 a $300.000"
        },
        "45": {
          "question_text": "Rango de ingresos",
          "response_type": "text",
          "response_value": "5 - De $1.200.001 a $1.500.000"
        }
      },
      "GENERAL": {
        "0": {
          "question_text": "ID de encuesta",
          "response_type": "numeric",
          "response_value": "532056"
        },
        "1": {
          "question_text": "Fecha de encuesta",
          "response_type": "text",
          "response_value": "2024-07-20T16:08:59.000000Z"
        }
      },
      "GEOGRÁFICO": {
        "111": {
          "question_text": "Código de localidad",
          "response_type": "numeric",
          "response_value": "1"
        },
        "113": {
          "question_text": "Nombre de localidad",
          "response_type": "text",
          "response_value": "Metropolitana"
        }
      },
      "NECESIDADES": {
        "65": {
          "question_text": "¿Tiene dificultad para ver?",
          "response_type": "boolean",
          "response_value": "No"
        },
        "66": {
          "question_text": "¿Tiene dificultad para oír?",
          "response_type": "boolean",
          "response_value": "No"
        },
        "67": {
          "question_text": "¿Tiene dificultad para caminar?",
          "response_type": "boolean",
          "response_value": "Si"
        }
      },
      "ACCESIBILIDAD": {
        "55": {
          "question_text": "Nivel de accesibilidad",
          "response_type": "text",
          "response_value": "3-Regular"
        },
        "56": {
          "question_text": "Tipo de apoyo recibido",
          "response_type": "text",
          "response_value": "1 - Subsidio de transporte"
        }
      },
      "CUIDADOR DE PcD": {
        "102": {
          "question_text": "Dirección - Calle",
          "response_type": "text",
          "response_value": "CL"
        },
        "103": {
          "question_text": "Dirección - Número",
          "response_type": "numeric",
          "response_value": "50"
        }
      },
      "SOCIODEMOGRÁFICA": {
        "4": {
          "question_text": "Sexo asignado al nacer",
          "response_type": "text",
          "response_value": "Femenino"
        },
        "5": {
          "question_text": "Identidad de género",
          "response_type": "text",
          "response_value": "Mujer"
        },
        "6": {
          "question_text": "Rango de edad",
          "response_type": "text",
          "response_value": "Mayor de 65 años"
        }
      },
      "TIPO DE DISCAPACIDAD": {
        "16": {
          "question_text": "Dificultad para pensar/memorizar",
          "response_type": "text",
          "response_value": "No Tiene dificultad"
        },
        "17": {
          "question_text": "Tipo de discapacidad",
          "response_type": "text",
          "response_value": "Es adquirida"
        }
      },
      "EDUCACIÓN Y ECONOMÍA": {
        "26": {
          "question_text": "Nivel educativo",
          "response_type": "text",
          "response_value": "7 - Múltiple"
        },
        "27": {
          "question_text": "Último nivel educativo alcanzado",
          "response_type": "text",
          "response_value": "Primaria incompleta"
        }
      }
    };
  };

  useEffect(() => {
    fetchSurveyData();
  }, []);

  const refresh = () => {
    fetchSurveyData();
  };

  return {
    surveyData,
    loading,
    error,
    refresh
  };
}
