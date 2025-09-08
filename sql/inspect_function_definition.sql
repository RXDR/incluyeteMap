-- Verificar la definición de la función
SELECT *
FROM information_schema.routines
WHERE routine_name = 'apply_cross_category_filters';

-- Verificar las columnas esperadas por la función
SELECT *
FROM information_schema.parameters
WHERE specific_name = 'apply_cross_category_filters';

-- Verificar las columnas generadas por la consulta
WITH total AS (
  SELECT
    location_data->>'barrio' as barrio,
    location_data->>'localidad' as localidad,
    COUNT(*)::bigint as total_encuestas
  FROM survey_responses
  WHERE location_data->>'barrio' IS NOT NULL
    AND location_data->>'barrio' != ''
  GROUP BY barrio, localidad
),
matches AS (
  SELECT
    location_data->>'barrio' as barrio,
    location_data->>'localidad' as localidad,
    COUNT(*)::bigint as matches_count
  FROM survey_responses
  WHERE responses_data->'TIPO DE DISCAPACIDAD'->>'Pensar, memorizar' = 'Es adquirida'
    AND location_data->>'barrio' IS NOT NULL
    AND location_data->>'barrio' != ''
  GROUP BY barrio, localidad
),
max_match AS (
  SELECT MAX(matches_count)::bigint AS max_count FROM matches
)
SELECT
  t.barrio,
  t.localidad,
  t.total_encuestas::numeric as total_encuestas,
  COALESCE(m.matches_count, 0)::numeric as matches_count,
  CASE WHEN t.total_encuestas > 0 THEN ROUND((COALESCE(m.matches_count,0)::numeric / t.total_encuestas::numeric) * 100, 2)::bigint ELSE 0 END as match_percentage,
  CASE WHEN max_match.max_count > 0 THEN ROUND((COALESCE(m.matches_count,0)::numeric / max_match.max_count::numeric) * 100, 2)::bigint ELSE 0 END as intensity_score,
  NULL::numeric as matched_responses
FROM total t
LEFT JOIN matches m ON t.barrio = m.barrio AND t.localidad = m.localidad
CROSS JOIN max_match
ORDER BY intensity_score DESC;
