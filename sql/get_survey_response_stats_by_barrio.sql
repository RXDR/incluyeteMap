-- Devuelve el total de respuestas por barrio y localidad para toda la encuesta, sin filtros
CREATE OR REPLACE FUNCTION get_survey_response_stats_by_barrio()
RETURNS TABLE (
  barrio text,
  localidad text,
  total_encuestas numeric,
  matches_count numeric,
  match_percentage numeric,
  intensity_score numeric,
  matched_responses jsonb,
  pieza_urba text,
  fill_opacity numeric
) AS $$
BEGIN
  RETURN QUERY
    SELECT
      location_data->>'barrio' as barrio,
      location_data->>'localidad' as localidad,
      COUNT(*)::numeric as total_encuestas,
      COUNT(*)::numeric as matches_count,
      100.0 as match_percentage,
      COUNT(*)::numeric as intensity_score,
      NULL::jsonb as matched_responses,
      NULL::text as pieza_urba,
      0.7 as fill_opacity
    FROM survey_responses
    WHERE location_data->>'barrio' IS NOT NULL
      AND location_data->>'barrio' != ''
    GROUP BY barrio, localidad
    ORDER BY intensity_score DESC;
END;
$$ LANGUAGE plpgsql;
