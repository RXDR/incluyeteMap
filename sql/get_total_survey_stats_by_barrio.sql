DROP FUNCTION IF EXISTS get_total_survey_stats_by_barrio(integer, integer);

CREATE OR REPLACE FUNCTION get_total_survey_stats_by_barrio(
  limit_rows integer DEFAULT 1000,
  offset_rows integer DEFAULT 0
)
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
    max_total AS (
      SELECT MAX(total_encuestas)::bigint AS max_count FROM total
    )
    SELECT
      t.barrio,
      t.localidad,
      t.total_encuestas::numeric as total_encuestas,
      t.total_encuestas::numeric as matches_count,
      100.0 as match_percentage,
      t.total_encuestas::numeric as intensity_score,
      NULL::jsonb as matched_responses,
      NULL::text as pieza_urba,
      CASE WHEN t.total_encuestas > 0 THEN 1.0 ELSE 0.7 END as fill_opacity
    FROM total t
    CROSS JOIN max_total
    ORDER BY t.total_encuestas DESC
    LIMIT ' || limit_rows || ' OFFSET ' || offset_rows || ';';
END;
$$ LANGUAGE plpgsql;