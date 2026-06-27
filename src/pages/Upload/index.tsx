import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { POINTS_UPLOAD } from '../../lib/points'
import { getMondayOfCurrentWeek } from '../../lib/rules'
import type { UserProfile, Zone } from '../../types'

const ZONES: { value: Zone; label: string; emoji: string }[] = [
  { value: 'living',     label: 'Living',     emoji: '🛋️' },
  { value: 'cocina',     label: 'Cocina',     emoji: '🍳' },
  { value: 'baño',       label: 'Baño',       emoji: '🚿' },
  { value: 'dormitorio', label: 'Dormitorio', emoji: '🛏️' },
  { value: 'patio',      label: 'Patio',      emoji: '🌿' },
  { value: 'otro',       label: 'Otro',       emoji: '📦' },
]

interface UploadProps {
  profile: UserProfile
  onSuccess: () => void
}

export default function Upload({ profile, onSuccess }: UploadProps) {
  const [name, setName] = useState('')
  const [zone, setZone] = useState<Zone | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !zone) return
    setLoading(true)
    setError(null)

    try {
      let imageUrl: string | null = null

      if (file) {
        const ext = file.name.split('.').pop() ?? 'jpg'
        const objectId = crypto.randomUUID()
        const path = `${profile.id}/${objectId}.${ext}`
        const { error: uploadError } = await supabase.storage.from('objects').upload(path, file)
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('objects').getPublicUrl(path)
        imageUrl = publicUrl
      }

      const { data: obj, error: insertError } = await supabase
        .from('objects')
        .insert({ uploaded_by: profile.id, name: name.trim(), zone, image_url: imageUrl })
        .select('id').single()

      if (insertError) throw insertError

      await supabase.from('point_transactions').insert({
        user_id: profile.id,
        points: POINTS_UPLOAD,
        reason: 'upload',
        reference_id: obj.id,
        week_start: getMondayOfCurrentWeek(),
      })

      setName('')
      setZone(null)
      setFile(null)
      setPreview(null)
      onSuccess()
    } catch {
      setError('Algo salió mal. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = name.trim().length > 0 && zone !== null && !loading

  return (
    <div className="flex-1 overflow-y-auto">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 py-5 max-w-md mx-auto">

        {/* Header */}
        <div>
          <h2
            className="font-display text-2xl font-bold"
            style={{ color: '#F4F4F5', fontFamily: "'Syne', sans-serif", fontWeight: 800 }}
          >
            Nuevo objeto
          </h2>
          <p className="text-sm mt-0.5" style={{ color: '#52525B' }}>
            Cargarlo suma <span style={{ color: '#10B981', fontWeight: 600 }}>+{POINTS_UPLOAD} puntos</span>
          </p>
        </div>

        {/* Foto */}
        <div>
          <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: '#52525B' }}>
            Foto <span style={{ color: '#3F3F46' }}>(opcional)</span>
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-52 rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-2 transition-colors"
            style={{ background: '#111118', border: `2px dashed ${preview ? 'transparent' : '#1E1E2E'}` }}
          >
            {preview ? (
              <img src={preview} alt="preview" className="w-full h-full object-cover" />
            ) : (
              <>
                <span className="text-4xl opacity-40">📷</span>
                <span className="text-sm" style={{ color: '#3F3F46' }}>Tocá para agregar foto</span>
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Nombre */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-widest" style={{ color: '#52525B' }}>
            Nombre del objeto
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ej: Silla rota del patio"
            className="rounded-xl px-4 py-3 text-sm outline-none transition-all"
            style={{ background: '#111118', border: '1px solid #1E1E2E', color: '#F4F4F5' }}
            onFocus={e => { e.target.style.borderColor = '#7C3AED'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)' }}
            onBlur={e => { e.target.style.borderColor = '#1E1E2E'; e.target.style.boxShadow = 'none' }}
          />
        </div>

        {/* Zona — chips scrolleables */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: '#52525B' }}>
            Zona
          </p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {ZONES.map(z => {
              const active = zone === z.value
              return (
                <motion.button
                  key={z.value}
                  type="button"
                  onClick={() => setZone(z.value)}
                  whileTap={{ scale: 0.95 }}
                  className="shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={active
                    ? { background: 'rgba(124,58,237,0.2)', border: '1px solid #7C3AED', color: '#C4B5FD' }
                    : { background: '#111118', border: '1px solid #1E1E2E', color: '#71717A' }
                  }
                >
                  <span>{z.emoji}</span>
                  {z.label}
                </motion.button>
              )
            })}
          </div>
        </div>

        {error && (
          <p
            className="text-sm text-center rounded-xl py-2.5 px-3"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            {error}
          </p>
        )}

        <motion.button
          type="submit"
          disabled={!canSubmit}
          whileTap={{ scale: 0.98 }}
          className="rounded-xl py-4 text-sm font-bold disabled:opacity-40"
          style={{
            background: canSubmit ? 'linear-gradient(135deg, #7C3AED, #06B6D4)' : '#1E1E2E',
            color: canSubmit ? '#fff' : '#52525B',
            fontFamily: "'Syne', sans-serif",
          }}
        >
          {loading ? 'Cargando...' : `Cargar objeto (+${POINTS_UPLOAD} pts)`}
        </motion.button>

      </form>
    </div>
  )
}
