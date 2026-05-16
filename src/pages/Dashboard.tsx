import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Bell, Image, Sparkles, Clock, Zap, TrendingUp, ChevronRight, Activity } from 'lucide-react'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import RingChart from '../components/RingChart'

// Mock data
const heartRateData = [
  { time: '6:00', bpm: 72 },
  { time: '7:00', bpm: 85 },
  { time: '8:00', bpm: 110 },
  { time: '9:00', bpm: 98 },
  { time: '10:00', bpm: 105 },
  { time: '11:00', bpm: 88 },
  { time: '12:00', bpm: 76 },
]

const historyRecords = [
  { time: '10:22 AM', bpm: 75, status: 'normal', activity: '伸展运动' },
  { time: '9:43 AM', bpm: 110, status: 'warning', activity: '快走' },
  { time: '9:15 AM', bpm: 98, status: 'normal', activity: '热身' },
  { time: '8:30 AM', bpm: 72, status: 'normal', activity: '休息' },
  { time: '7:00 AM', bpm: 68, status: 'normal', activity: '晨间活动' },
]

import { useLanguage } from '../contexts/LanguageContext'
import { useUser } from '../contexts/UserContext'
import { translations } from '../i18n'

export default function Dashboard() {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const { user } = useUser()
  const t = translations[language].dashboard

  const [displayedText, setDisplayedText] = useState('')
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Typing effect for AI analysis
  useEffect(() => {
    let index = 0
    const text = t.aiAnalysisText.replace(/\{name\}/g, user.name)
    setDisplayedText('')
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1))
        index++
      } else {
        clearInterval(timer)
      }
    }, 30)
    return () => clearInterval(timer)
  }, [t.aiAnalysisText, user.name])

  return (
    <div className={`p-8 max-w-[1400px] mx-auto transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
      {/* Hero Section */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-[var(--text-primary)] tracking-tight mb-2">
            {t.todayReport}
          </h1>
          <p className="text-[var(--text-secondary)] text-base">
            {t.welcome.replace(/\{name\}/g, user.name)}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 max-w-[280px]">
          <div className="w-10 h-10 rounded-xl bg-[var(--terracotta)]/10 flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-[var(--terracotta)]" />
          </div>
          <p className="text-sm text-[var(--text-primary)] leading-snug">
            {t.notification}
          </p>
        </div>
      </div>

      {/* Bento Grid Dashboard */}
      <div className="grid grid-cols-12 gap-6">
        {/* Card A: Duration & Calories */}
        <div className={`col-span-3 bg-white rounded-[24px] p-6 shadow-sm card-hover ${isVisible ? 'animate-fade-in-up stagger-1' : ''}`} style={{ opacity: isVisible ? 1 : 0 }}>
          <div className="space-y-6">
            {/* Duration */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-[var(--text-muted)]" />
                <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{t.duration}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-[var(--text-primary)] tabular-nums">27</span>
                <span className="text-lg text-[var(--text-secondary)]">{t.minutes}</span>
              </div>
            </div>

            {/* Ring Chart */}
            <div className="flex justify-center">
              <RingChart value={27} max={60} size={140} strokeWidth={10} color="#1A1A1A" label={t.goal} delay={300} />
            </div>

            {/* Divider */}
            <div className="border-t border-[var(--border)]" />

            {/* Calories */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-[var(--terracotta)]" />
                <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{t.calories}</span>
              </div>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-4xl font-bold text-[var(--terracotta)] tabular-nums">160</span>
                <span className="text-lg text-[var(--text-secondary)]">{t.kcal}</span>
              </div>
              {/* Mini progress bar */}
              <div className="h-2 bg-[#F0F0F0] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[var(--terracotta)] rounded-full transition-all duration-1000 ease-out"
                  style={{ width: '33%' }}
                />
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-2">{t.todayGoal} 33%</p>
            </div>
          </div>
        </div>

        {/* Card B: Posture Captured */}
        <div className={`col-span-4 bg-white rounded-[24px] p-6 shadow-sm card-hover ${isVisible ? 'animate-fade-in-up stagger-2' : ''}`} style={{ opacity: isVisible ? 1 : 0 }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Image className="w-5 h-5 text-[var(--terracotta)]" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">{t.postureCapture}</h3>
            </div>
            <button 
              onClick={() => navigate('/records/1')}
              className="text-xs text-[var(--terracotta)] hover:text-[var(--terracotta-dark)] font-medium flex items-center gap-1 transition-colors"
            >
              {t.viewAll}
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="relative bg-gradient-to-b from-[#FDF8F5] to-[#F5EDE8] rounded-2xl overflow-hidden mb-4">
            <img
              src="/exercise-posture.png"
              alt="运动姿势"
              className="w-full h-64 object-contain"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--success)]" />
              <span className="text-sm text-[var(--text-secondary)]">{t.postureFeedback}</span>
            </div>
            <span className="text-xs text-[var(--text-muted)]">92% {t.accuracy}</span>
          </div>
        </div>

        {/* Card C: Active Status */}
        <div className={`col-span-5 bg-white rounded-[24px] p-6 shadow-sm card-hover ${isVisible ? 'animate-fade-in-up stagger-3' : ''}`} style={{ opacity: isVisible ? 1 : 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <div className="w-3 h-3 rounded-full bg-[var(--success)]" />
              <div className="absolute inset-0 w-3 h-3 rounded-full bg-[var(--success)] animate-breathe" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">{t.liveStatus}</h3>
            <span className="px-3 py-1 bg-[var(--success)]/10 text-[var(--success)] text-xs font-medium rounded-full">
              {t.exercising}
            </span>
          </div>

          <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-6">
            {t.liveDesc.replace(/\{name\}/g, user.name)}
          </p>

          {/* Mini stats grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#FDF8F5] rounded-2xl p-4 text-center">
              <TrendingUp className="w-5 h-5 text-[var(--terracotta)] mx-auto mb-2" />
              <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">105</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{t.avgHeartRate}</p>
            </div>
            <div className="bg-[#FDF8F5] rounded-2xl p-4 text-center">
              <Activity className="w-5 h-5 text-[var(--terracotta)] mx-auto mb-2" />
              <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">92%</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{t.postureScore}</p>
            </div>
            <div className="bg-[#FDF8F5] rounded-2xl p-4 text-center">
              <Zap className="w-5 h-5 text-[var(--terracotta)] mx-auto mb-2" />
              <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">5</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{t.streakDays}</p>
            </div>
          </div>
        </div>

        {/* Card D: AI Analysis */}
        <div className={`col-span-4 bg-white rounded-[24px] p-6 shadow-sm card-hover ${isVisible ? 'animate-fade-in-up stagger-4' : ''}`} style={{ opacity: isVisible ? 1 : 0 }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-[var(--terracotta)]" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">{t.aiAnalysis}</h3>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <div className="bg-[#F5F5F5] rounded-2xl rounded-bl-sm p-4">
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed typing-cursor min-h-[100px]">
                  {displayedText}
                </p>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-2 ml-1">{t.aiAssistantName}</p>
            </div>
            <div className="w-24 flex-shrink-0">
              <img
                src="/ai-robot.png"
                alt="AI"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>

        {/* Card E: Heart Rate History */}
        <div className={`col-span-8 bg-white rounded-[24px] p-6 shadow-sm card-hover ${isVisible ? 'animate-fade-in-up stagger-5' : ''}`} style={{ opacity: isVisible ? 1 : 0 }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">{t.heartRateHistory}</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--text-muted)]">{t.todayAvg}</span>
              <span className="text-xl font-bold text-[var(--terracotta)] tabular-nums">105</span>
              <span className="text-xs text-[var(--text-muted)]">{t.bpm}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Chart */}
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={heartRateData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="heartRateGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D97D54" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#D97D54" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#9CA3AF' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#9CA3AF' }}
                    domain={[50, 130]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      fontSize: '13px',
                    }}
                    formatter={(value: number) => [`${value} ${t.bpm}`, t.heartRate]}
                  />
                  <Area
                    type="monotone"
                    dataKey="bpm"
                    stroke="#D97D54"
                    strokeWidth={2.5}
                    fill="url(#heartRateGradient)"
                    dot={{ fill: '#D97D54', strokeWidth: 2, r: 4, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#D97D54', stroke: '#fff', strokeWidth: 2 }}
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* History List */}
            <div className="space-y-3">
              {historyRecords.map((record, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-[#FDF8F5] transition-colors cursor-pointer group"
                  onClick={() => navigate('/records')}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-2.5 h-2.5 rounded-full flex-shrink-0
                      ${record.status === 'normal' ? 'bg-[var(--success)]' : 'bg-[var(--warning)]'}
                    `} />
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{translations[language].activities[record.activity as keyof typeof translations['en']['activities']] || record.activity}</p>
                      <p className="text-xs text-[var(--text-muted)]">{record.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                      {record.bpm}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">{t.bpm}</span>
                    <ChevronRight className="w-4 h-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
