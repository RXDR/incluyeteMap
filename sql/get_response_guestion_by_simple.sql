
BEGIN
  RETURN QUERY
  WITH response_counts AS (
    SELECT 
      sr.responses_data -> category_name ->> question_id as value,
      COUNT(*) as count
    FROM survey_responses sr
    WHERE sr.responses_data ? category_name 
      AND sr.responses_data -> category_name ? question_id
      AND sr.responses_data -> category_name ->> question_id IS NOT NULL
      AND sr.responses_data -> category_name ->> question_id != ''
    GROUP BY sr.responses_data -> category_name ->> question_id
    LIMIT 10
  ),
  total_count AS (
    SELECT SUM(count) as total FROM response_counts
  )
  SELECT 
    rc.value as response_value,
    rc.count as response_count,
    CASE 
      WHEN tc.total > 0 THEN ROUND((rc.count::NUMERIC / tc.total::NUMERIC) * 100, 2)
      ELSE 0 
    END as response_percentage
  FROM response_counts rc, total_count tc
  ORDER BY rc.count DESC;
END;

----

DECLARE
  categorias TEXT[];
  registro RECORD;
BEGIN
  -- Lista de categorías esperadas
  -- Puedes ajustar esta lista si cambian las categorías
  -- Si quieres que sea dinámica, puedes obtenerla de tu mapeo en el frontend
  -- Aquí la dejo fija para tu caso actual
  IF TRUE THEN
    SELECT metadata->'category_distribution' AS dist
    INTO registro
    FROM survey_responses
    WHERE metadata->'category_distribution' IS NOT NULL
      AND metadata->'category_distribution'::text <> '{}'
      AND (
        metadata->'category_distribution' ? 'OTROS'
        AND metadata->'category_distribution' ? 'SALUD'
        AND metadata->'category_distribution' ? 'CERTIFICADO'
        AND metadata->'category_distribution' ? 'NECESIDADES'
        AND metadata->'category_distribution' ? 'ACCESIBILIDAD'
        AND metadata->'category_distribution' ? 'CUIDADEOR DE PCD'
        AND metadata->'category_distribution' ? 'SOCIODEMOGRÁFICO'
        AND metadata->'category_distribution' ? 'CONDICIONES DE VIDA'
        AND metadata->'category_distribution' ? 'TIPO DE DISCAPACIDAD'
        AND metadata->'category_distribution' ? 'NECESIDAD DE CUIDADOR'
        AND metadata->'category_distribution' ? 'EDUCACIÓN Y ECONOMÍA'
      )
    LIMIT 1;

    IF registro.dist IS NOT NULL THEN
      SELECT array_agg(TRIM(key))
      INTO categorias
      FROM json_object_keys(registro.dist::json) AS key;
      RETURN categorias;
    ELSE
      RETURN ARRAY[]::TEXT[];
    END IF;
  END IF;
END;