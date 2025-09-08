-- Step 1: Inspect the structure of the table `survey_responses`
\d+ survey_responses;

-- Step 2: View a few rows of data to understand the structure of `location_data` and `responses_data`
SELECT * FROM survey_responses LIMIT 5;

-- Step 3: Check for indexes on the table to ensure query optimization
SELECT * FROM pg_indexes WHERE tablename = 'survey_responses';

-- Step 4: Validate the existence of specific fields in `responses_data` JSONB
SELECT DISTINCT jsonb_object_keys(responses_data) AS keys FROM survey_responses LIMIT 10;

-- Step 5: Validate the existence of specific fields in `location_data` JSONB
SELECT DISTINCT jsonb_object_keys(location_data) AS keys FROM survey_responses LIMIT 10;

-- Step 6: Check for sample values in `responses_data` for a specific key (e.g., 'TIPO DE DISCAPACIDAD')
SELECT DISTINCT responses_data->'TIPO DE DISCAPACIDAD' AS tipo_discapacidad FROM survey_responses LIMIT 10;

-- Step 7: Check for sample values in `location_data` for a specific key (e.g., 'barrio')
SELECT DISTINCT location_data->>'barrio' AS barrio FROM survey_responses LIMIT 10;
