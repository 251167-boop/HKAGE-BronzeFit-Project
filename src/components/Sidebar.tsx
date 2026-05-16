import { Home, Activity, MessageSquare, Settings } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'
import { useLanguage } from '../contexts/LanguageContext'
import { useUser } from '../contexts/UserContext'
import { translations } from '../i18n'

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { language } = useLanguage()
  const { user } = useUser()
  const t = translations[language].sidebar

  const navItems = [
    { icon: Home, label: t.overview, path: '/' },
    { icon: Activity, label: t.records, path: '/records' },
    { icon: MessageSquare, label: t.aiAssistant, path: '/chat' },
    { icon: Settings, label: t.profile, path: '/profile' },
  ]

  return (
    <aside className="fixed left-0 top-0 h-screen w-20 glass-nav border-r border-[#E5E5E5]/50 z-50 flex flex-col items-center py-8 transition-all duration-300 hover:w-64 group">
      {/* Logo */}
      <div className="mb-12 flex items-center gap-3 px-4">
        <div className="w-10 h-10 rounded-xl bg-[var(--terracotta)] flex items-center justify-center flex-shrink-0">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <span className="font-semibold text-lg text-[var(--text-primary)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap overflow-hidden">
          ElderCare
        </span>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 flex flex-col items-center gap-2 w-full px-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`
                relative w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200
                ${isActive 
                  ? 'bg-[var(--terracotta)]/10 text-[var(--terracotta)]' 
                  : 'text-[var(--text-muted)] hover:bg-gray-100 hover:text-[var(--text-secondary)]'
                }
              `}
            >
              <Icon className="w-6 h-6 flex-shrink-0" strokeWidth={isActive ? 2.5 : 1.5} />
              <span className={`
                font-medium text-sm whitespace-nowrap overflow-hidden
                opacity-0 group-hover:opacity-100 transition-opacity duration-300
              `}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[var(--terracotta)] rounded-r-full" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom - Avatar */}
      <div 
        className="mt-auto flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-100 rounded-xl mx-2 mb-4 transition-colors"
        onClick={() => navigate('/profile')}
      >
        <img
          src={user.avatar || "/grandpa-avatar.jpg"}
          alt={user.name}
          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md flex-shrink-0"
        />
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap overflow-hidden">
          <p className="text-sm font-medium text-[var(--text-primary)]">{user.name}</p>
          <p className="text-xs text-[var(--text-muted)]">{user.age} {t.ageUnit}</p>
        </div>
      </div>
    </aside>
  )
}
