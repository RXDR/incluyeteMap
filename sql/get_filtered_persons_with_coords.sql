DROP FUNCTION IF EXISTS public.get_filtered_persons_with_coords(jsonb[], integer, integer);

CREATE OR REPLACE FUNCTION public.get_filtered_persons_with_coords(
  filters jsonb[],
  limit_rows integer DEFAULT 1000,
  offset_rows integer DEFAULT 0
)
RETURNS TABLE (
  id integer,
  barrio text,
  localidad text,
  address text,
  x numeric,
  y numeric,
  metadata jsonb,
  responses_data jsonb
) AS $$
DECLARE
  filtro jsonb;
  where_sql text := 'TRUE'; -- Siempre empieza válido
BEGIN
  IF filters IS NULL OR array_length(filters, 1) = 0 THEN
    RAISE EXCEPTION 'Se requiere al menos un filtro';
  END IF;

  -- Construir el WHERE dinámico (AND entre todos los filtros)
  FOREACH filtro IN ARRAY filters LOOP
    where_sql := where_sql || format(
      ' AND (responses_data->%L->>%L = %L)',
      filtro->>'category',
      filtro->>'questionId',
      filtro->>'response'
    );
  END LOOP;

  RETURN QUERY EXECUTE
    'SELECT 
      row_number() OVER ()::integer as id,
      location_data->>''barrio'' as barrio,
      location_data->>''localidad'' as localidad,
      location_data->>''address'' as address,
      (location_data->''coordinates''->>''x'')::numeric as x,
      (location_data->''coordinates''->>''y'')::numeric as y,
      metadata,
      responses_data
    FROM survey_responses
    WHERE ' || where_sql || '
      AND location_data->>''barrio'' IS NOT NULL
      AND location_data->>''barrio'' != '''' '
    || ' LIMIT ' || limit_rows || ' OFFSET ' || offset_rows || ';';
END;
$$ LANGUAGE plpgsql;