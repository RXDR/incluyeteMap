CREATE OR REPLACE FUNCTION apply_cross_category_filters(filters jsonb[])
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
DECLARE
  filtro jsonb;
  where_sql text := '';
BEGIN
  -- Validar que hay al menos un filtro
  IF filters IS NULL OR array_length(filters, 1) = 0 THEN
    RAISE EXCEPTION 'Se requiere al menos un filtro';
  END IF;

  -- Construir el WHERE dinámico (AND entre todos los filtros)
  FOREACH filtro IN ARRAY filters LOOP
    IF where_sql <> '' THEN
      where_sql := where_sql || ' AND ';
    END IF;
    where_sql := where_sql ||
      format(
        '(responses_data->%L->>%L = %L)',
        filtro->>'category',
        filtro->>'questionId',
        filtro->>'response'
      );
  END LOOP;

  RETURN QUERY EXECUTE
    'WITH total AS (
      SELECT
        location_data->>''barrio'' as barrio,
        location_data->>''localidad'' as localidad,
        COUNT(*)::bigint as total_encuestas
      FROM survey_responses
      WHERE location_data->>''barrio'' IS NOT NULL
        AND location_data->>''barrio'' != ''''
      GROUP BY barrio, localidad
    ),
    matches AS (
      SELECT
        location_data->>''barrio'' as barrio,
        location_data->>''localidad'' as localidad,
        COUNT(DISTINCT responses_data->>''person_id'')::bigint as matches_count
      FROM survey_responses
      WHERE ' || where_sql || '
        AND location_data->>''barrio'' IS NOT NULL
        AND location_data->>''barrio'' != ''''
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
      CASE WHEN t.total_encuestas > 0 THEN ROUND((COALESCE(m.matches_count,0)::numeric / t.total_encuestas::numeric) * 100, 2) ELSE 0 END as match_percentage,
      CASE WHEN t.total_encuestas > 1 THEN COALESCE(m.matches_count, 0)::numeric ELSE 0 END as intensity_score,
      NULL::jsonb as matched_responses,
      NULL::text as pieza_urba,
      CASE WHEN t.total_encuestas > 0 THEN 0.5 + 0.5 * (COALESCE(m.matches_count,0)::numeric / t.total_encuestas::numeric) ELSE 0.7 END as fill_opacity
    FROM total t
    LEFT JOIN matches m ON t.barrio = m.barrio AND t.localidad = m.localidad
    CROSS JOIN max_match
    ORDER BY intensity_score DESC';
END;
$$ LANGUAGE plpgsql;
