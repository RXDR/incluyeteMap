

DROP FUNCTION IF EXISTS get_filtered_persons_with_coords(jsonb[], integer, integer);

CREATE OR REPLACE FUNCTION get_filtered_persons_with_coords(
  filters jsonb[],
  limit_rows integer DEFAULT 1000,
  offset_rows integer DEFAULT 0
)
RETURNS TABLE (
  id integer,
  nombre text,
  x numeric,
  y numeric,
  barrio text,
  localidad text
) AS $$
DECLARE
  filtro jsonb;
  where_sql text := 'TRUE';
BEGIN
  IF filters IS NULL OR array_length(filters, 1) = 0 THEN
    RAISE EXCEPTION 'Se requiere al menos un filtro';
  END IF;

  FOREACH filtro IN ARRAY filters LOOP
    IF filtro ? 'category' AND (filtro->>'category' IS NOT NULL AND filtro->>'category' != '') THEN
      where_sql := where_sql || format(
        ' AND (responses_data->%L->>%L = %L)',
        filtro->>'category',
        filtro->>'questionId',
        filtro->>'response'
      );
    ELSE
      where_sql := where_sql || format(
        ' AND (sociodemographic_data->>%L = %L)',
        filtro->>'questionId',
        filtro->>'response'
      );
    END IF;
  END LOOP;

  RETURN QUERY EXECUTE
    'SELECT 
      row_number() OVER ()::integer as id,
      (
        (sociodemographic_data::jsonb->>''PRIMER NOMBRE'') || '' '' ||
        (sociodemographic_data::jsonb->>''SEGUNDO NOMBRE'') || '' '' ||
        (sociodemographic_data::jsonb->>''PRIMER APELLIDO'') || '' '' ||
        (sociodemographic_data::jsonb->>''SEGUNDO APELLIDO'')
      ) as nombre,
      (location_data::jsonb->'coordinates'->>''x'')::numeric as x,
      (location_data::jsonb->'coordinates'->>''y'')::numeric as y,
      location_data::jsonb->>''barrio'' as barrio,
      location_data::jsonb->>''localidad'' as localidad
    FROM survey_responses
    WHERE ' || where_sql || '
      AND location_data::jsonb->>''barrio'' IS NOT NULL
      AND location_data::jsonb->>''barrio'' != '''' '
    || ' LIMIT ' || limit_rows || ' OFFSET ' || offset_rows || ';';
END;
$$ LANGUAGE plpgsql;