-- src/sql/get_question_responses_normalized.sql
-- Devuelve el top de respuestas para una pregunta específica en una categoría JSONB
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

-- Devuelve el top de respuestas por barrio para una pregunta específica
CREATE OR REPLACE FUNCTION get_question_responses_by_barrio(
  category TEXT,
  question TEXT
)
RETURNS TABLE (
  BEGIN
    RETURN QUERY
      SELECT
        location_data->>''barrio'' as barrio,
        location_data->>''localidad'' as localidad,
        (location_data->''coordinates''->>''x'')::numeric as coordx,
        (location_data->''coordinates''->>''y'')::numeric as coordy,
        COUNT(*) as total_encuestas
      FROM survey_responses
      WHERE location_data->>''barrio'' IS NOT NULL
        AND location_data->>''barrio'' != ''''
        AND location_data->''coordinates''->>''x'' IS NOT NULL
        AND location_data->''coordinates''->>''y'' IS NOT NULL
      GROUP BY barrio, localidad, coordx, coordy
    ),
    matches AS (
      SELECT
        location_data->>''barrio'' as barrio,
        location_data->>''localidad'' as localidad,
        (location_data->''coordinates''->>''x'')::numeric as coordx,
        (location_data->''coordinates''->>''y'')::numeric as coordy,
        COUNT(*) as matches_count
      FROM survey_responses
      WHERE ' || where_sql || '
        AND location_data->>''barrio'' IS NOT NULL
        AND location_data->>''barrio'' != ''''
        AND location_data->''coordinates''->>''x'' IS NOT NULL
        AND location_data->''coordinates''->>''y'' IS NOT NULL
      GROUP BY barrio, localidad, coordx, coordy
    ),
    max_match AS (
      SELECT MAX(matches_count) AS max_count FROM matches
    )
    SELECT
      t.barrio,
      t.localidad,
      t.coordx,
      t.coordy,
      t.total_encuestas,
      COALESCE(m.matches_count, 0) as matches_count,
      CASE WHEN t.total_encuestas > 0 THEN ROUND((COALESCE(m.matches_count,0)::numeric / t.total_encuestas::numeric) * 100, 2) ELSE 0 END as match_percentage,
      CASE WHEN max_match.max_count > 0 THEN ROUND((COALESCE(m.matches_count,0)::numeric / max_match.max_count::numeric) * 100, 2) ELSE 0 END as intensity_score,
      NULL::jsonb as matched_responses
    FROM total t
    LEFT JOIN matches m ON t.barrio = m.barrio AND t.localidad = m.localidad AND t.coordx = m.coordx AND t.coordy = m.coordy
    CROSS JOIN max_match
    WHERE COALESCE(m.matches_count,0) > 0
    ORDER BY matches_count DESC;
  END;
