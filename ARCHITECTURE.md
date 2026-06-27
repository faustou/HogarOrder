# ARCHITECTURE.md — HogarOrder

## Stack

| Capa | Tecnología | Motivo |
|------|-----------|--------|
| Frontend | React 18 + Vite + TypeScript | Rápido, familiar, mobile-first |
| Estilos | Tailwind CSS | Utility-first, ideal para mobile |
| Backend | Supabase | Auth + DB + Storage + Realtime en uno |
| Deploy | Vercel | CI/CD automático desde GitHub |
| Animaciones | CSS nativo o Framer Motion (si hace falta) | Swipe fluido |

---

## Base de datos (Supabase / PostgreSQL)

### `users`
Extiende `auth.users` de Supabase.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT NOT NULL,               -- "Fausto" o "Mamá"
  role TEXT DEFAULT 'member',       -- 'admin' | 'member'
  total_points INT DEFAULT 0,       -- puntos históricos acumulados
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `objects`
Cada objeto cargado por un usuario.

```sql
CREATE TABLE objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by UUID REFERENCES users(id) NOT NULL,
  name TEXT NOT NULL,
  zone TEXT NOT NULL,               -- 'living' | 'cocina' | 'placard' | etc.
  image_url TEXT,                   -- URL del Storage
  status TEXT DEFAULT 'pending',    -- 'pending' | 'resolved' | 'postponed'
  queue_position INT,               -- para la cola de swipe
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `decisions`
Cada resolución de un objeto.

```sql
CREATE TABLE decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id UUID REFERENCES objects(id) NOT NULL,
  decided_by UUID REFERENCES users(id) NOT NULL,
  action TEXT NOT NULL,             -- 'tirar' | 'donar' | 'reubicar' | 'dejar_con_exp' | 'posponer' | 'dejar'
  explanation TEXT,                 -- solo para 'dejar_con_exp'
  points_awarded INT NOT NULL,      -- puntos que se sumaron/restaron
  decided_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `point_transactions`
Log de todos los movimientos de puntos. Fuente de verdad.

```sql
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  points INT NOT NULL,              -- puede ser negativo
  reason TEXT NOT NULL,             -- 'upload' | 'tirar' | 'donar' | etc.
  reference_id UUID,                -- id del objeto o decisión relacionado
  week_start DATE NOT NULL,         -- lunes de la semana en curso
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `weekly_cycles`
Registro del resultado de cada semana.

```sql
CREATE TABLE weekly_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL UNIQUE,
  user1_points INT DEFAULT 0,
  user2_points INT DEFAULT 0,
  objective INT NOT NULL,           -- objetivo conjunto configurado
  objective_reached BOOLEAN DEFAULT FALSE,
  loser_id UUID REFERENCES users(id),  -- quién paga más
  closed BOOLEAN DEFAULT FALSE,
  closed_at TIMESTAMPTZ
);
```

---

## Lógica de puntos centralizada

Toda la lógica vive en `src/lib/points.ts`:

```typescript
export const POINTS = {
  UPLOAD: 5,
  TIRAR: 10,
  DONAR: 15,
  REUBICAR: 7,
  DEJAR_CON_EXP: 0,
  POSPONER: -5,
  DEJAR: -10,
} as const;

// Regla de ratio: necesitás 3 cargas por cada resolución
export const UPLOAD_TO_RESOLVE_RATIO = 3;

export function canResolve(uploads: number, resolutions: number): boolean {
  return uploads >= (resolutions + 1) * UPLOAD_TO_RESOLVE_RATIO;
}
```

---

## Supabase Storage

- **Bucket:** `objects` (público para lectura, autenticado para escritura)
- **Path:** `{user_id}/{object_id}.{ext}`
- **Tamaño máximo:** 5MB por imagen
- **Formatos:** jpg, jpeg, png, webp

---

## RLS (Row Level Security)

```sql
-- objects: cada usuario ve todos pero solo edita los suyos
ALTER TABLE objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read all" ON objects FOR SELECT USING (true);
CREATE POLICY "insert own" ON objects FOR INSERT WITH CHECK (uploaded_by = auth.uid());

-- decisions: cada usuario solo inserta las suyas
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read all" ON decisions FOR SELECT USING (true);
CREATE POLICY "insert own" ON decisions FOR INSERT WITH CHECK (decided_by = auth.uid());

-- point_transactions: cada usuario solo ve las suyas
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own transactions" ON point_transactions USING (user_id = auth.uid());
```

---

## Flujo principal — Swipe

```
Usuario abre la app
  → Se carga el próximo objeto en cola (status = 'pending', ordered by queue_position)
  → Se verifica canResolve(user.uploads, user.resolutions)
    → Si NO puede resolver: se muestra bloqueo con cuántas cargas le faltan
    → Si SÍ puede resolver: se muestra la SwipeCard
  → Usuario elige acción
  → Se guarda en decisions
  → Se actualiza objects.status
  → Se inserta en point_transactions
  → Se actualiza users.total_points
  → Se carga el siguiente objeto
```

---

## Flujo — Carga de objeto

```
Usuario abre Upload
  → Sube foto (se guarda en Storage)
  → Completa nombre + zona
  → Se guarda en objects (status = 'pending')
  → Se inserta +5 en point_transactions
  → Se actualiza users.total_points
  → Se asigna queue_position al final de la cola
```

---

## Ciclo semanal

- La semana empieza el **lunes a las 00:00 ARS**
- Los puntos semanales se calculan sumando `point_transactions` donde `week_start = lunes_actual`
- Al cierre de semana (domingo 23:59 o lunes siguiente):
  - Se comparan puntos semanales de ambos usuarios
  - Si ambos >= objetivo → `objective_reached = true`, ambos pagan $10.000
  - Si no → el que menos puntos tenga es `loser_id`, paga $20.000
  - Se guarda en `weekly_cycles`
- Los puntos históricos en `users.total_points` **nunca se resetean**

---

## Variables de entorno

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```
