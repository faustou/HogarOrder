# ROADMAP.md — HogarOrder

## Estado actual
🟡 Fase 0 — Planificación completada

---

## Fase 1 — Fundación (MVP funcional)
**Objetivo:** Los dos usuarios pueden cargar objetos y tomar decisiones. Los puntos funcionan.

### 1.1 Setup del proyecto
- [ ] Crear proyecto Vite + React + TypeScript
- [ ] Configurar Tailwind CSS
- [ ] Conectar Supabase (auth, db, storage)
- [ ] Deploy inicial en Vercel
- [ ] Configurar variables de entorno

### 1.2 Supabase — Base de datos
- [ ] Crear tabla `users` (extendida de auth.users)
- [ ] Crear tabla `objects`
- [ ] Crear tabla `decisions`
- [ ] Crear tabla `weekly_cycles`
- [ ] Crear tabla `point_transactions`
- [ ] Configurar RLS policies
- [ ] Crear bucket `objects` en Storage

### 1.3 Auth
- [ ] Login con email/password (solo los 2 usuarios hardcodeados)
- [ ] Persistencia de sesión
- [ ] Hook `useUser`

### 1.4 Cargar objetos
- [ ] Formulario de carga: foto, nombre, zona
- [ ] Upload de imagen a Supabase Storage
- [ ] Guardar en tabla `objects`
- [ ] Sumar +5 puntos al cargar
- [ ] Registrar en `point_transactions`

### 1.5 Sistema de swipe
- [ ] Vista de swipe card (objeto pendiente)
- [ ] Mostrar: foto, nombre, zona, quién lo cargó
- [ ] Opciones: Tirar / Donar / Reubicar / Dejar (con exp.) / Posponer / Dejar
- [ ] Validación de ratio cargas/resoluciones antes de permitir resolver
- [ ] Guardar decisión en `decisions`
- [ ] Actualizar puntos según opción elegida
- [ ] Lógica de "Posponer" (manda al final de la cola)

### 1.6 Puntos y leaderboard
- [ ] Componente `WeeklyScore` — puntos de la semana de cada uno
- [ ] Componente `Leaderboard` — quién va ganando
- [ ] Lógica de fin de semana (determinar perdedor/ganador)

---

## Fase 2 — Experiencia completa
**Objetivo:** La app es agradable de usar y tiene el ciclo semanal funcionando.

### 2.1 UX del swipe
- [ ] Animación de swipe (CSS o Framer Motion)
- [ ] Feedback visual al ganar/perder puntos
- [ ] Pantalla de motivación cuando no hay objetos pendientes
- [ ] Indicador de cuántos objetos podés resolver todavía (ratio)

### 2.2 Ciclo semanal
- [ ] Cron job o trigger en Supabase para cerrar semana cada lunes
- [ ] Registro del resultado semanal (quién ganó, quién paga)
- [ ] Notificación/alerta en la app al cerrar la semana
- [ ] Configuración del objetivo semanal conjunto (solo admin)

### 2.3 Historial
- [ ] Página de historial de objetos resueltos
- [ ] Filtrar por decisión (tirado, donado, etc.)
- [ ] Historial de puntos por semana

### 2.4 Zonas
- [ ] Gestión de zonas (living, cocina, placard, etc.)
- [ ] Ver objetos pendientes por zona
- [ ] Nivel de "desorden" por zona (% de objetos sin resolver)

---

## Fase 3 — Polish y extras
**Objetivo:** La app está pulida y es divertida de usar.

### 3.1 Notificaciones (nice to have)
- [ ] Recordatorio si no cargaste nada en 2 días
- [ ] Alerta cuando el objetivo semanal está cerca

### 3.2 Stats y visualizaciones
- [ ] Gráfico de puntos por semana
- [ ] Objetos donados vs tirados vs reubicados
- [ ] Racha de días activos

### 3.3 Foto antes/después de zona (nice to have)
- [ ] Subir foto de zona antes de ordenar
- [ ] Subir foto después
- [ ] Comparación visual

---

## Criterio de "listo para usar"
La app está lista para uso real cuando Fase 1 esté 100% completa.
Fase 2 la hacemos en uso, ajustando según feedback real de los usuarios (nosotros).
