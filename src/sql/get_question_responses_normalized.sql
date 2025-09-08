-- src/sql/get_question_responses_normalized.sql
-- Devuelve las respuestas agrupadas y normalizadas para una pregunta específica en una categoría JSONB
CREATE OR REPLACE FUNCTION get_question_responses_normalized(
  category TEXT,
  question TEXT
)
RETURNS TABLE (
  response_value TEXT,
  response_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
    SELECT
      normalize_response_label(value) AS response_value,
      COUNT(*) AS response_count
    FROM
      survey_responses,
      LATERAL jsonb_each_text(responses_data->category) AS t(key, value)
    WHERE
      key = question
    GROUP BY
      response_value
    ORDER BY
      response_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Ejemplo de uso:
-- SELECT * FROM get_question_responses_normalized('OTROS', '¿Cuál es su identidad de género / la identidad de género de la persona con discapacidad actualmente?');
