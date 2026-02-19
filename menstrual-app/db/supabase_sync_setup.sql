-- ============================================================
-- WatermelonDB ↔ Supabase Sync Setup
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- 1. Enable Row Level Security
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own logs"
ON public.daily_logs FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Auto-update `updated_at` on every row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.daily_logs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Pull RPC — returns all changes since last_pulled_at for the authenticated user
-- If the user is new (no data), returns empty arrays. If last_pulled_at is null (first sync),
-- returns ALL records for this user.
CREATE OR REPLACE FUNCTION watermelon_pull(last_pulled_at bigint DEFAULT 0)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _ts timestamp with time zone;
  _created jsonb;
  _updated jsonb;
  _deleted jsonb;
BEGIN
  -- Convert millisecond timestamp to timestamptz (0 or null = epoch = return everything)
  IF last_pulled_at IS NULL OR last_pulled_at = 0 THEN
    _ts := '1970-01-01T00:00:00Z'::timestamptz;
  ELSE
    _ts := to_timestamp(last_pulled_at / 1000.0);
  END IF;

  -- Created: records created after _ts that are NOT soft-deleted
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', dl.id,
      'date', dl.date::text,
      'bleeding_flow', dl.bleeding_flow,
      'bleeding_color', dl.bleeding_color,
      'moods_json', COALESCE(dl.moods_json::text, '[]'),
      'symptoms_json', COALESCE(dl.symptoms_json::text, '[]'),
      'cravings_json', COALESCE(dl.cravings_json::text, '[]'),
      'exercise_json', COALESCE(dl.exercise_json::text, '{"types":[],"stepCount":null}'),
      'work_load', dl.work_load,
      'sleep_hours', dl.sleep_hours,
      'sleep_quality', dl.sleep_quality,
      'weight', dl.weight,
      'birth_control', dl.birth_control,
      'smoke', dl.smoke,
      'alcohol', dl.alcohol,
      'created_at', (EXTRACT(EPOCH FROM dl.created_at) * 1000)::bigint,
      'updated_at', (EXTRACT(EPOCH FROM dl.updated_at) * 1000)::bigint
    )
  ), '[]'::jsonb) INTO _created
  FROM public.daily_logs dl
  WHERE dl.user_id = auth.uid()
    AND dl.created_at > _ts
    AND dl.deleted_at IS NULL;

  -- Updated: records updated after _ts but created BEFORE _ts (so not in created set)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', dl.id,
      'date', dl.date::text,
      'bleeding_flow', dl.bleeding_flow,
      'bleeding_color', dl.bleeding_color,
      'moods_json', COALESCE(dl.moods_json::text, '[]'),
      'symptoms_json', COALESCE(dl.symptoms_json::text, '[]'),
      'cravings_json', COALESCE(dl.cravings_json::text, '[]'),
      'exercise_json', COALESCE(dl.exercise_json::text, '{"types":[],"stepCount":null}'),
      'work_load', dl.work_load,
      'sleep_hours', dl.sleep_hours,
      'sleep_quality', dl.sleep_quality,
      'weight', dl.weight,
      'birth_control', dl.birth_control,
      'smoke', dl.smoke,
      'alcohol', dl.alcohol,
      'created_at', (EXTRACT(EPOCH FROM dl.created_at) * 1000)::bigint,
      'updated_at', (EXTRACT(EPOCH FROM dl.updated_at) * 1000)::bigint
    )
  ), '[]'::jsonb) INTO _updated
  FROM public.daily_logs dl
  WHERE dl.user_id = auth.uid()
    AND dl.updated_at > _ts
    AND dl.created_at <= _ts
    AND dl.deleted_at IS NULL;

  -- Deleted: IDs of records soft-deleted after _ts
  SELECT COALESCE(jsonb_agg(dl.id), '[]'::jsonb) INTO _deleted
  FROM public.daily_logs dl
  WHERE dl.user_id = auth.uid()
    AND dl.deleted_at > _ts;

  RETURN jsonb_build_object(
    'changes', jsonb_build_object(
      'daily_logs', jsonb_build_object(
        'created', _created,
        'updated', _updated,
        'deleted', _deleted
      )
    ),
    'timestamp', (EXTRACT(EPOCH FROM now()) * 1000)::bigint
  );
END;
$$;

-- 4. Push RPC — applies client changes (created, updated, deleted) for the authenticated user
CREATE OR REPLACE FUNCTION watermelon_push(changes jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _record jsonb;
  _id text;
BEGIN
  -- Process created records
  FOR _record IN SELECT jsonb_array_elements(changes->'daily_logs'->'created')
  LOOP
    INSERT INTO public.daily_logs (
      id, user_id, date,
      bleeding_flow, bleeding_color,
      moods_json, symptoms_json, cravings_json, exercise_json,
      work_load, sleep_hours, sleep_quality, weight,
      birth_control, smoke, alcohol,
      created_at, updated_at
    ) VALUES (
      _record->>'id',
      auth.uid(),
      (_record->>'date')::date,
      _record->>'bleeding_flow',
      _record->>'bleeding_color',
      CASE WHEN _record->>'moods_json' IS NOT NULL THEN (_record->>'moods_json')::jsonb ELSE NULL END,
      CASE WHEN _record->>'symptoms_json' IS NOT NULL THEN (_record->>'symptoms_json')::jsonb ELSE NULL END,
      CASE WHEN _record->>'cravings_json' IS NOT NULL THEN (_record->>'cravings_json')::jsonb ELSE NULL END,
      CASE WHEN _record->>'exercise_json' IS NOT NULL THEN (_record->>'exercise_json')::jsonb ELSE NULL END,
      _record->>'work_load',
      CASE WHEN _record->>'sleep_hours' IS NOT NULL THEN (_record->>'sleep_hours')::numeric ELSE NULL END,
      _record->>'sleep_quality',
      CASE WHEN _record->>'weight' IS NOT NULL THEN (_record->>'weight')::numeric ELSE NULL END,
      CASE WHEN _record->>'birth_control' IS NOT NULL THEN (_record->>'birth_control')::boolean ELSE NULL END,
      CASE WHEN _record->>'smoke' IS NOT NULL THEN (_record->>'smoke')::boolean ELSE NULL END,
      CASE WHEN _record->>'alcohol' IS NOT NULL THEN (_record->>'alcohol')::boolean ELSE NULL END,
      CASE WHEN _record->>'created_at' IS NOT NULL
        THEN to_timestamp((_record->>'created_at')::bigint / 1000.0)
        ELSE now() END,
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      date = EXCLUDED.date,
      bleeding_flow = EXCLUDED.bleeding_flow,
      bleeding_color = EXCLUDED.bleeding_color,
      moods_json = EXCLUDED.moods_json,
      symptoms_json = EXCLUDED.symptoms_json,
      cravings_json = EXCLUDED.cravings_json,
      exercise_json = EXCLUDED.exercise_json,
      work_load = EXCLUDED.work_load,
      sleep_hours = EXCLUDED.sleep_hours,
      sleep_quality = EXCLUDED.sleep_quality,
      weight = EXCLUDED.weight,
      birth_control = EXCLUDED.birth_control,
      smoke = EXCLUDED.smoke,
      alcohol = EXCLUDED.alcohol,
      updated_at = now();
  END LOOP;

  -- Process updated records
  FOR _record IN SELECT jsonb_array_elements(changes->'daily_logs'->'updated')
  LOOP
    INSERT INTO public.daily_logs (
      id, user_id, date,
      bleeding_flow, bleeding_color,
      moods_json, symptoms_json, cravings_json, exercise_json,
      work_load, sleep_hours, sleep_quality, weight,
      birth_control, smoke, alcohol,
      created_at, updated_at
    ) VALUES (
      _record->>'id',
      auth.uid(),
      (_record->>'date')::date,
      _record->>'bleeding_flow',
      _record->>'bleeding_color',
      CASE WHEN _record->>'moods_json' IS NOT NULL THEN (_record->>'moods_json')::jsonb ELSE NULL END,
      CASE WHEN _record->>'symptoms_json' IS NOT NULL THEN (_record->>'symptoms_json')::jsonb ELSE NULL END,
      CASE WHEN _record->>'cravings_json' IS NOT NULL THEN (_record->>'cravings_json')::jsonb ELSE NULL END,
      CASE WHEN _record->>'exercise_json' IS NOT NULL THEN (_record->>'exercise_json')::jsonb ELSE NULL END,
      _record->>'work_load',
      CASE WHEN _record->>'sleep_hours' IS NOT NULL THEN (_record->>'sleep_hours')::numeric ELSE NULL END,
      _record->>'sleep_quality',
      CASE WHEN _record->>'weight' IS NOT NULL THEN (_record->>'weight')::numeric ELSE NULL END,
      CASE WHEN _record->>'birth_control' IS NOT NULL THEN (_record->>'birth_control')::boolean ELSE NULL END,
      CASE WHEN _record->>'smoke' IS NOT NULL THEN (_record->>'smoke')::boolean ELSE NULL END,
      CASE WHEN _record->>'alcohol' IS NOT NULL THEN (_record->>'alcohol')::boolean ELSE NULL END,
      CASE WHEN _record->>'created_at' IS NOT NULL
        THEN to_timestamp((_record->>'created_at')::bigint / 1000.0)
        ELSE now() END,
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      date = EXCLUDED.date,
      bleeding_flow = EXCLUDED.bleeding_flow,
      bleeding_color = EXCLUDED.bleeding_color,
      moods_json = EXCLUDED.moods_json,
      symptoms_json = EXCLUDED.symptoms_json,
      cravings_json = EXCLUDED.cravings_json,
      exercise_json = EXCLUDED.exercise_json,
      work_load = EXCLUDED.work_load,
      sleep_hours = EXCLUDED.sleep_hours,
      sleep_quality = EXCLUDED.sleep_quality,
      weight = EXCLUDED.weight,
      birth_control = EXCLUDED.birth_control,
      smoke = EXCLUDED.smoke,
      alcohol = EXCLUDED.alcohol,
      updated_at = now();
  END LOOP;

  -- Process deleted records (soft delete)
  FOR _id IN SELECT jsonb_array_elements_text(changes->'daily_logs'->'deleted')
  LOOP
    UPDATE public.daily_logs
    SET deleted_at = now(), updated_at = now()
    WHERE id = _id AND user_id = auth.uid();
  END LOOP;
END;
$$;
