# CLAUDE.md — HogarOrder

## Qué es este proyecto

HogarOrder es una app mobile-first para gestionar el orden del hogar entre dos personas (Fausto y su mamá). El core es un sistema de micro-decisiones estilo swipe (tipo Tinder) sobre objetos cargados por los usuarios, con gamificación real mediante puntos y penalidades semanales en pesos.

No es una app de listas. Es una app de decisiones + responsabilidad compartida.

## Stack

- **Frontend:** React + Vite + TypeScript
- **Backend/DB:** Supabase (auth, PostgreSQL, storage para fotos, realtime)
- **Deploy:** Vercel
- **Estilos:** Tailwind CSS

## Usuarios

Exactamente 2 usuarios fijos con cuentas persistentes en Supabase Auth:
- **Fausto** (usuario 1)
- **Mamá** (usuario 2)

No hay registro público. Los usuarios se crean una sola vez y no se pierden datos entre sesiones.

## Reglas de negocio (CRÍTICAS — no cambiar sin revisar toda la lógica de puntos)

### Cargar un objeto
- El usuario sube: foto, nombre del objeto, zona (living, cocina, placard, etc.)
- Estado inicial: `pending` (esperando decisión)
- Puntos al cargar: **+5 pts** para quien cargó

### Resolver un objeto (swipe)
- Solo se puede resolver un objeto si tenés **saldo positivo de cargas**: por cada resolución necesitás haber cargado 3 objetos propios más de los que ya resolviste.
- Fórmula: `cargas_propias >= (resoluciones_propias + 1) * 3`
- Resolver = acción física ya realizada, el swipe confirma lo hecho

### Opciones de decisión y puntos
| Opción | Puntos |
|--------|--------|
| Tirar | +10 |
| Donar | +15 |
| Reubicar | +7 |
| Dejar (con explicación) | 0 |
| Posponer | -5 (vuelve al final de la cola) |
| Dejar (sin justificación) | -10 |

### Sistema semanal
- Cada lunes se reinicia el ciclo (pero NO los puntos acumulados históricos — se guardan)
- Al finalizar la semana se comparan puntos **ganados esa semana**
- El que menos puntos hizo esa semana → paga **$20.000 ARS** para la casa
- Si ambos llegan al **objetivo semanal conjunto** (ej: 300 pts entre los dos) → pagan **$10.000 ARS c/u**
- El objetivo semanal es configurable desde la app (solo para Fausto como admin)

## Estructura de carpetas esperada

```
src/
  components/
    SwipeCard/
    ObjectUpload/
    Leaderboard/
    WeeklyScore/
  pages/
    Home/
    Upload/
    History/
    Admin/
  lib/
    supabase.ts
    points.ts       ← lógica de puntos centralizada acá
    rules.ts        ← reglas de negocio (ratios de carga/resolución)
  hooks/
    useUser.ts
    useObjects.ts
    usePoints.ts
  types/
    index.ts
```

## Convenciones

- Todo el código en TypeScript estricto
- Lógica de puntos SIEMPRE en `src/lib/points.ts`, nunca inline
- Reglas de negocio SIEMPRE en `src/lib/rules.ts`
- Nunca calcular puntos en el frontend sin pasar por estas funciones
- Usar Supabase Row Level Security para que cada usuario solo vea/modifique lo suyo
- Fotos de objetos → Supabase Storage, bucket `objects`
- No usar `any` en TypeScript

## Notas de producto

- La app debe funcionar perfectamente en mobile (es el uso principal)
- El swipe tiene que sentirse fluido y responsivo
- Si no hay objetos pendientes de resolver → mostrar pantalla de motivación, no pantalla vacía
- El historial de puntos nunca se borra
- Posponer manda el objeto al final de la cola, no lo elimina
