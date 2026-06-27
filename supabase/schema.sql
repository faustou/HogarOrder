-- ============================================================
-- HogarOrder — Schema completo
-- Correr en: Supabase Dashboard → SQL Editor → New query
-- ============================================================


-- ============================================================
-- 1. TABLAS
-- ============================================================

CREATE TABLE public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  total_points INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.objects (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  zone           TEXT NOT NULL CHECK (zone IN ('living', 'cocina', 'baño', 'dormitorio', 'patio', 'otro')),
  image_url      TEXT,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'postponed')),
  queue_position INT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.decisions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id      UUID NOT NULL REFERENCES public.objects(id) ON DELETE CASCADE,
  decided_by     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action         TEXT NOT NULL CHECK (action IN ('tirar', 'donar', 'reubicar', 'dejar_con', 'posponer', 'dejar_sin')),
  explanation    TEXT,
  points_awarded INT NOT NULL,
  decided_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.point_transactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  points       INT NOT NULL,
  reason       TEXT NOT NULL CHECK (reason IN ('upload', 'tirar', 'donar', 'reubicar', 'dejar_con', 'posponer', 'dejar_sin')),
  reference_id UUID,
  week_start   DATE NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.weekly_cycles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start        DATE NOT NULL UNIQUE,
  user1_points      INT NOT NULL DEFAULT 0,
  user2_points      INT NOT NULL DEFAULT 0,
  objective         INT NOT NULL DEFAULT 300,
  objective_reached BOOLEAN NOT NULL DEFAULT FALSE,
  loser_id          UUID REFERENCES public.users(id),
  closed            BOOLEAN NOT NULL DEFAULT FALSE,
  closed_at         TIMESTAMPTZ
);

CREATE TABLE public.app_config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Valor inicial del objetivo semanal
INSERT INTO public.app_config (key, value) VALUES ('weekly_objective', '300');


-- ============================================================
-- 2. ÍNDICES
-- ============================================================

CREATE INDEX idx_objects_status         ON public.objects(status);
CREATE INDEX idx_objects_uploaded_by    ON public.objects(uploaded_by);
CREATE INDEX idx_objects_queue          ON public.objects(queue_position) WHERE status = 'pending';
CREATE INDEX idx_decisions_object_id    ON public.decisions(object_id);
CREATE INDEX idx_point_tx_user_week     ON public.point_transactions(user_id, week_start);


-- ============================================================
-- 3. FUNCIÓN: actualizar total_points automáticamente
-- ============================================================

CREATE OR REPLACE FUNCTION update_user_total_points()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET total_points = total_points + NEW.points
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_total_points
AFTER INSERT ON public.point_transactions
FOR EACH ROW EXECUTE FUNCTION update_user_total_points();


-- ============================================================
-- 4. FUNCIÓN: asignar queue_position al cargar objeto
-- ============================================================

CREATE OR REPLACE FUNCTION assign_queue_position()
RETURNS TRIGGER AS $$
BEGIN
  NEW.queue_position := COALESCE(
    (SELECT MAX(queue_position) FROM public.objects WHERE status = 'pending'),
    0
  ) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_assign_queue_position
BEFORE INSERT ON public.objects
FOR EACH ROW EXECUTE FUNCTION assign_queue_position();


-- ============================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objects            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_cycles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config         ENABLE ROW LEVEL SECURITY;

-- users: todos pueden ver, cada uno edita el suyo
CREATE POLICY "users_select_all"   ON public.users FOR SELECT USING (true);
CREATE POLICY "users_insert_own"   ON public.users FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "users_update_own"   ON public.users FOR UPDATE USING (id = auth.uid());

-- objects: todos ven, solo el dueño inserta/edita
CREATE POLICY "objects_select_all" ON public.objects FOR SELECT USING (true);
CREATE POLICY "objects_insert_own" ON public.objects FOR INSERT WITH CHECK (uploaded_by = auth.uid());
CREATE POLICY "objects_update_own" ON public.objects FOR UPDATE USING (uploaded_by = auth.uid());

-- decisions: todos ven, cada uno inserta las suyas
CREATE POLICY "decisions_select_all" ON public.decisions FOR SELECT USING (true);
CREATE POLICY "decisions_insert_own" ON public.decisions FOR INSERT WITH CHECK (decided_by = auth.uid());

-- point_transactions: cada usuario solo ve las suyas
CREATE POLICY "point_tx_own" ON public.point_transactions
  FOR ALL USING (user_id = auth.uid());

-- weekly_cycles: todos pueden leer
CREATE POLICY "weekly_cycles_select" ON public.weekly_cycles FOR SELECT USING (true);

-- app_config: todos pueden leer
CREATE POLICY "app_config_select" ON public.app_config FOR SELECT USING (true);


-- ============================================================
-- 6. STORAGE — bucket "objects"
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'objects',
  'objects',
  true,
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "storage_select_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'objects');

CREATE POLICY "storage_insert_auth" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'objects' AND auth.role() = 'authenticated');

CREATE POLICY "storage_delete_own" ON storage.objects
  FOR DELETE USING (bucket_id = 'objects' AND auth.uid()::text = (storage.foldername(name))[1]);
