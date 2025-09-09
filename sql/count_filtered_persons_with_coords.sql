-- Función para contar los registros filtrados
DROP FUNCTION IF EXISTS public.count_filtered_persons_with_coords(jsonb[]);

CREATE OR REPLACE FUNCTION public.count_filtered_persons_with_coords(
  filters jsonb[]
)
RETURNS integer AS $$
DECLARE
  filtro jsonb;
  where_sql text := 'TRUE';
  total integer;
BEGIN
  IF filters IS NULL OR array_length(filters, 1) = 0 THEN
    RAISE EXCEPTION 'Se requiere al menos un filtro';
  END IF;

  FOREACH filtro IN ARRAY filters LOOP
    where_sql := where_sql || format(
      ' AND (responses_data->%L->>%L = %L)',
      filtro->>'category',
      filtro->>'questionId',
      filtro->>'response'
    );
  END LOOP;

  EXECUTE 'SELECT COUNT(*) FROM survey_responses WHERE ' || where_sql || '
    AND location_data->>''barrio'' IS NOT NULL
    AND location_data->>''barrio'' != '''''
  INTO total;

  RETURN total;
END;
$$ LANGUAGE plpgsql;
