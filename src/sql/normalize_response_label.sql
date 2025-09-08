-- src/sql/normalize_response_label.sql
-- Función SQL para normalizar respuestas de texto en Postgres (útil en Supabase)
CREATE OR REPLACE FUNCTION normalize_response_label(val TEXT)
RETURNS TEXT AS $$
DECLARE
  norm TEXT;
BEGIN
  IF val IS NULL THEN RETURN NULL; END IF;
  norm := UPPER(TRIM(val));
  -- Quitar tildes
  norm := translate(norm, 'ÁÉÍÓÚÜÑáéíóúüñ', 'AEIOUUNAEIOUUN');
  IF norm IN ('SI', 'SÍ') THEN RETURN 'Si'; END IF;
  IF norm = 'NO' THEN RETURN 'No'; END IF;
  IF norm = 'FEMENINO' THEN RETURN 'Femenino'; END IF;
  IF norm = 'MASCULINO' THEN RETURN 'Masculino'; END IF;
  IF norm = 'MUJER' THEN RETURN 'Mujer'; END IF;
  IF norm = 'HOMBRE' THEN RETURN 'Hombre'; END IF;
  -- Capitalizar por defecto
  RETURN INITCAP(LOWER(val));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Ejemplo de uso en un SELECT:
-- SELECT normalize_response_label(respuesta) AS respuesta_normalizada, COUNT(*)
-- FROM respuestas
-- GROUP BY respuesta_normalizada
-- ORDER BY COUNT(*) DESC;

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
    )
    SELECT
      t.barrio,
      t.localidad,
      t.coordx,
      t.coordy,
      t.total_encuestas,
      COALESCE(m.matches_count, 0) as matches_count,
      CASE WHEN t.total_encuestas > 0 THEN ROUND((COALESCE(m.matches_count,0)::numeric / t.total_encuestas::numeric) * 100, 2) ELSE 0 END as match_percentage,
      CASE WHEN COALESCE(m.matches_count,0) > 0 THEN GREATEST(25, ROUND(((COALESCE(m.matches_count,0)::numeric / NULLIF(t.total_encuestas,0)) * LN(COALESCE(m.matches_count,0) + 1) * 100)::numeric, 2)) ELSE 0 END as intensity_score,
      NULL::jsonb as matched_responses
    FROM total t
    LEFT JOIN matches m ON t.barrio = m.barrio AND t.localidad = m.localidad AND t.coordx = m.coordx AND t.coordy = m.coordy
    WHERE COALESCE(m.matches_count,0) > 0
    ORDER BY matches_count DESC';
END;
