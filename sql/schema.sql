create table public.survey_responses (
  id text not null,
  sociodemographic_data jsonb null default '{}'::jsonb,
  location_data jsonb null default '{"barrio": "", "address": "", "localidad": "", "coordinates": {"x": null, "y": null}}'::jsonb,
  responses_data jsonb null default '{}'::jsonb,
  metadata jsonb null default '{"stratum": "", "row_number": 0, "observations": "", "processing_date": "", "category_distribution": {}}'::jsonb,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint survey_responses_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_survey_responses_responses_data on public.survey_responses using gin (responses_data) TABLESPACE pg_default;

create index IF not exists idx_survey_responses_sociodemographic on public.survey_responses using gin (sociodemographic_data) TABLESPACE pg_default;

create index IF not exists idx_survey_responses_metadata on public.survey_responses using gin (metadata) TABLESPACE pg_default;

create index IF not exists idx_survey_responses_location_localidad on public.survey_responses using btree (((location_data ->> 'localidad'::text))) TABLESPACE pg_default;

create index IF not exists idx_survey_responses_location_barrio on public.survey_responses using btree (((location_data ->> 'barrio'::text))) TABLESPACE pg_default;

create index IF not exists idx_survey_responses_created_at on public.survey_responses using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_survey_responses_location_coords on public.survey_responses using btree (
  (
    (
      (location_data -> 'coordinates'::text) ->> 'x'::text
    )
  ),
  (
    (
      (location_data -> 'coordinates'::text) ->> 'y'::text
    )
  )
) TABLESPACE pg_default;

create trigger update_survey_responses_updated_at BEFORE
update on survey_responses for EACH row
execute FUNCTION update_updated_at_column ();