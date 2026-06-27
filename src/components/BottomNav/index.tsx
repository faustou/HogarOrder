export type Page = 'home' | 'swipe' | 'upload'

interface Tab {
  page: Page
  label: string
  icon: string
}

const TABS: Tab[] = [
  { page: 'home',   label: 'Inicio',   icon: '⚡' },
  { page: 'swipe',  label: 'Resolver', icon: '🃏' },
  { page: 'upload', label: 'Cargar',   icon: '＋' },
]

interface BottomNavProps {
  current: Page
  onChange: (page: Page) => void
}

export default function BottomNav({ current, onChange }: BottomNavProps) {
  return (
    <nav
      className="shrink-0 flex border-t"
      style={{ background: '#0E0E16', borderColor: '#1E1E2E' }}
    >
      {TABS.map(tab => {
        const active = current === tab.page
        return (
          <button
            key={tab.page}
            onClick={() => onChange(tab.page)}
            className="flex-1 flex flex-col items-center gap-1 py-3 transition-colors"
            style={{ color: active ? '#7C3AED' : '#52525B' }}
          >
            <span
              className="text-xl leading-none transition-transform"
              style={{
                transform: active ? 'scale(1.15)' : 'scale(1)',
                filter: active ? 'drop-shadow(0 0 8px rgba(124,58,237,0.7))' : 'none',
              }}
            >
              {tab.icon}
            </span>
            <span
              className="text-[10px] font-medium tracking-wide"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
