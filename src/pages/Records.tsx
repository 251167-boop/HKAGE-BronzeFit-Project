import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Clock, Zap, Heart, Image, ChevronRight, Calendar, Filter } from 'lucide-react'

interface ExerciseRecord {
  id: number
  date: string
  time: string
  duration: number
  calories: number
  avgHeartRate: number
  maxHeartRate: number
  postureScore: number
  activity: string
  status: 'normal' | 'warning' | 'alert'
}

const mockRecords: ExerciseRecord[] = [
  {
    id: 1,
    date: '2026-05-02',
    time: '09:15',
    duration: 27,
    calories: 160,
    avgHeartRate: 98,
    maxHeartRate: 115,
    postureScore: 92,
    activity: '晨练组合',
    status: 'normal',
  },
  {
    id: 2,
    date: '2026-05-01',
    time: '08:30',
    duration: 35,
    calories: 210,
    avgHeartRate: 105,
    maxHeartRate: 128,
    postureScore: 88,
    activity: '太极运动',
    status: 'normal',
  },
  {
    id: 3,
    date: '2026-04-30',
    time: '10:00',
    duration: 20,
    calories: 120,
    avgHeartRate: 112,
    maxHeartRate: 135,
    postureScore: 75,
    activity: '平衡训练',
    status: 'warning',
  },
  {
    id: 4,
    date: '2026-04-29',
    time: '09:00',
    duration: 40,
    calories: 245,
    avgHeartRate: 95,
    maxHeartRate: 118,
    postureScore: 94,
    activity: '柔韧性训练',
    status: 'normal',
  },
  {
    id: 5,
    date: '2026-04-28',
    time: '08:45',
    duration: 30,
    calories: 185,
    avgHeartRate: 108,
    maxHeartRate: 142,
    postureScore: 82,
    activity: '快走',
    status: 'warning',
  },
  {
    id: 6,
    date: '2026-04-27',
    time: '09:30',
    duration: 25,
    calories: 150,
    avgHeartRate: 88,
    maxHeartRate: 105,
    postureScore: 96,
    activity: '呼吸练习',
    status: 'normal',
  },
  {
    id: 7,
    date: '2026-04-26',
    time: '10:15',
    duration: 45,
    calories: 280,
    avgHeartRate: 115,
    maxHeartRate: 155,
    postureScore: 70,
    activity: '力量训练',
    status: 'alert',
  },
  {
    id: 8,
    date: '2026-04-25',
    time: '08:00',
    duration: 30,
    calories: 175,
    avgHeartRate: 92,
    maxHeartRate: 110,
    postureScore: 90,
    activity: '晨练组合',
    status: 'normal',
  },
]

import { useLanguage } from '../contexts/LanguageContext'
import { useUser } from '../contexts/UserContext'
import { translations } from '../i18n'

export default function Records() {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const { user } = useUser()
  const t = translations[language].records
  
  const [isVisible, setIsVisible] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'normal' | 'warning' | 'alert'>('all')

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const filteredRecords = filterStatus === 'all' 
    ? mockRecords 
    : mockRecords.filter(r => r.status === filterStatus)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-[var(--success)]'
      case 'warning': return 'bg-[var(--warning)]'
      case 'alert': return 'bg-[var(--destructive)]'
      default: return 'bg-[var(--success)]'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'normal': return t.normal
      case 'warning': return t.warning
      case 'alert': return t.alert
      default: return t.normal
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-[var(--success)]/10 text-[var(--success)]'
      case 'warning': return 'bg-[var(--warning)]/10 text-[var(--warning)]'
      case 'alert': return 'bg-[var(--destructive)]/10 text-[var(--destructive)]'
      default: return 'bg-[var(--success)]/10 text-[var(--success)]'
    }
  }

  return (
    <div className={`p-8 max-w-[1400px] mx-auto transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-[var(--text-primary)] tracking-tight mb-2">
            {t.title}
          </h1>
          <p className="text-[var(--text-secondary)] text-base">
            {t.subtitle.replace(/\{name\}/g, user.name)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 shadow-sm">
            <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="text-sm text-[var(--text-secondary)]">{t.date}</span>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">{t.workoutsThisMonth}</p>
          <p className="text-3xl font-bold text-[var(--text-primary)] tabular-nums">24</p>
          <p className="text-xs text-[var(--success)] mt-1 flex items-center gap-1">
            <span>↑ 12%</span>
            <span className="text-[var(--text-muted)]">{t.vsLastMonth}</span>
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">{t.totalDuration}</p>
          <p className="text-3xl font-bold text-[var(--terracotta)] tabular-nums">18.5</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">{t.hours}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">{t.avgHeartRate}</p>
          <p className="text-3xl font-bold text-[var(--text-primary)] tabular-nums">102</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">{t.bpm}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">{t.avgPostureScore}</p>
          <p className="text-3xl font-bold text-[var(--text-primary)] tabular-nums">87</p>
          <p className="text-xs text-[var(--success)] mt-1 flex items-center gap-1">
            <span>↑ 5%</span>
            <span className="text-[var(--text-muted)]">{t.vsLastMonth}</span>
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <Filter className="w-4 h-4 text-[var(--text-muted)]" />
        {(['all', 'normal', 'warning', 'alert'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`
              px-4 py-2 rounded-xl text-sm font-medium transition-all
              ${filterStatus === status 
                ? 'bg-[var(--terracotta)] text-white shadow-sm' 
                : 'bg-white text-[var(--text-secondary)] hover:bg-gray-50'
              }
            `}
          >
            {status === 'all' ? t.all : getStatusLabel(status)}
          </button>
        ))}
      </div>

      {/* Records List */}
      <div className="space-y-4">
        {filteredRecords.map((record, index) => (
          <div
            key={record.id}
            onClick={() => navigate(`/records/${record.id}`)}
            className={`
              bg-white rounded-2xl p-6 shadow-sm cursor-pointer
              hover:shadow-md hover:-translate-y-0.5 transition-all duration-200
              ${isVisible ? 'animate-fade-in-up' : ''}
            `}
            style={{ animationDelay: `${index * 0.08}s`, opacity: isVisible ? 1 : 0 }}
          >
            <div className="flex items-center gap-6">
              {/* Date */}
              <div className="flex-shrink-0 w-16 text-center">
                <p className="text-xs text-[var(--text-muted)]">{record.date.split('-')[1]}{t.month}</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{record.date.split('-')[2]}</p>
              </div>

              {/* Divider */}
              <div className="w-px h-12 bg-[var(--border)]" />

              {/* Activity Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">{translations[language].activities[record.activity as keyof typeof translations['en']['activities']] || record.activity}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(record.status)}`}>
                    {getStatusLabel(record.status)}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-muted)]">{record.time} · {record.duration} {t.durationLabel}</p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <span className="text-xs text-[var(--text-muted)]">{t.durationLabel}</span>
                  </div>
                  <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">{record.duration} {t.min}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Zap className="w-3.5 h-3.5 text-[var(--terracotta)]" />
                    <span className="text-xs text-[var(--text-muted)]">{t.caloriesLabel}</span>
                  </div>
                  <p className="text-sm font-semibold text-[var(--terracotta)] tabular-nums">{record.calories} {t.kcal}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Heart className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-xs text-[var(--text-muted)]">{t.heartRateLabel}</span>
                  </div>
                  <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">{record.avgHeartRate} {t.bpm}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Image className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <span className="text-xs text-[var(--text-muted)]">{t.postureLabel}</span>
                  </div>
                  <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">{record.postureScore}%</p>
                </div>
              </div>

              {/* Status Dot & Arrow */}
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(record.status)}`} />
                <ChevronRight className="w-5 h-5 text-[var(--text-muted)]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
