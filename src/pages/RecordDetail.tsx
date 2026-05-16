import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ArrowLeft, Clock, Zap, Heart, Image, Sparkles, TrendingUp, Award, AlertTriangle } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'

const heartRateDetailData = [
  { time: '0min', bpm: 72 },
  { time: '5min', bpm: 85 },
  { time: '10min', bpm: 98 },
  { time: '15min', bpm: 112 },
  { time: '20min', bpm: 105 },
  { time: '25min', bpm: 115 },
  { time: '27min', bpm: 88 },
]

const postureData = [
  { part: '头部', score: 95 },
  { part: '肩部', score: 88 },
  { part: '背部', score: 92 },
  { part: '手臂', score: 85 },
  { time: '腿部', score: 90 },
]

import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../i18n'

export default function RecordDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { language } = useLanguage()
  const t = translations[language].detail
  const tGlobal = translations[language]

  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Mock record data based on ID
  const record = {
    id: Number(id),
    date: '2026年5月2日',
    time: '09:15',
    duration: 27,
    calories: 160,
    avgHeartRate: 98,
    maxHeartRate: 115,
    minHeartRate: 72,
    postureScore: 92,
    activity: '晨练组合',
    status: 'normal' as const,
    notes: '今天天气很好，爷爷精神不错',
  }

  return (
    <div className={`p-8 max-w-[1400px] mx-auto transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
      {/* Back Button & Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/records')}
          className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
            {tGlobal.activities[record.activity as keyof typeof tGlobal.activities] || record.activity}
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            {record.date} · {record.time} · {record.duration} {t.minutes}
          </p>
        </div>
        <span className="ml-auto px-4 py-1.5 bg-[var(--success)]/10 text-[var(--success)] text-sm font-medium rounded-full">
          {t[record.status]}
        </span>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className={`bg-white rounded-2xl p-5 shadow-sm ${isVisible ? 'animate-fade-in-up stagger-1' : ''}`} style={{ opacity: isVisible ? 1 : 0 }}>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-[var(--terracotta)]" />
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{t.duration}</span>
          </div>
          <p className="text-3xl font-bold text-[var(--text-primary)] tabular-nums">{record.duration}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">{t.minutes}</p>
        </div>
        <div className={`bg-white rounded-2xl p-5 shadow-sm ${isVisible ? 'animate-fade-in-up stagger-2' : ''}`} style={{ opacity: isVisible ? 1 : 0 }}>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-[var(--terracotta)]" />
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{t.calories}</span>
          </div>
          <p className="text-3xl font-bold text-[var(--terracotta)] tabular-nums">{record.calories}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">{t.kcal}</p>
        </div>
        <div className={`bg-white rounded-2xl p-5 shadow-sm ${isVisible ? 'animate-fade-in-up stagger-3' : ''}`} style={{ opacity: isVisible ? 1 : 0 }}>
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-4 h-4 text-red-400" />
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{t.avgHeartRate}</span>
          </div>
          <p className="text-3xl font-bold text-[var(--text-primary)] tabular-nums">{record.avgHeartRate}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">{t.bpm}</p>
        </div>
        <div className={`bg-white rounded-2xl p-5 shadow-sm ${isVisible ? 'animate-fade-in-up stagger-4' : ''}`} style={{ opacity: isVisible ? 1 : 0 }}>
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-[var(--terracotta)]" />
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{t.postureScore}</span>
          </div>
          <p className="text-3xl font-bold text-[var(--text-primary)] tabular-nums">{record.postureScore}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">{t.scoreUnit}</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left: Heart Rate Chart */}
        <div className={`col-span-7 bg-white rounded-[24px] p-6 shadow-sm ${isVisible ? 'animate-fade-in-up stagger-2' : ''}`} style={{ opacity: isVisible ? 1 : 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[var(--terracotta)]" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">{t.heartRateTrend}</h3>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-[var(--text-muted)]">{t.max}</span>
                <span className="font-semibold text-[var(--text-primary)] tabular-nums">{record.maxHeartRate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[var(--text-muted)]">{t.min}</span>
                <span className="font-semibold text-[var(--text-primary)] tabular-nums">{record.minHeartRate}</span>
              </div>
            </div>
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={heartRateDetailData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="detailGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D97D54" stopOpacity={0.25} />
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
                  domain={[50, 140]}
                />
                <Tooltip
                  contentStyle={{
                    background: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    fontSize: '13px',
                  }}
                  formatter={(value: number) => [`${value} ${t.bpm}`, tGlobal.dashboard.heartRate]}
                />
                <Area
                  type="monotone"
                  dataKey="bpm"
                  stroke="#D97D54"
                  strokeWidth={2.5}
                  fill="url(#detailGradient)"
                  dot={{ fill: '#D97D54', strokeWidth: 2, r: 4, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: '#D97D54', stroke: '#fff', strokeWidth: 2 }}
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-5 space-y-6">
          {/* Posture Score */}
          <div className={`bg-white rounded-[24px] p-6 shadow-sm ${isVisible ? 'animate-fade-in-up stagger-3' : ''}`} style={{ opacity: isVisible ? 1 : 0 }}>
            <div className="flex items-center gap-2 mb-4">
              <Image className="w-5 h-5 text-[var(--terracotta)]" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">{t.postureAnalysis}</h3>
            </div>

            {/* Posture Image */}
            <div className="bg-gradient-to-b from-[#FDF8F5] to-[#F5EDE8] rounded-2xl overflow-hidden mb-4">
              <img
                src="/exercise-posture.png"
                alt="运动姿势"
                className="w-full h-48 object-contain"
              />
            </div>

            {/* Posture Bar Chart */}
            <div className="h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={postureData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis 
                    dataKey="part" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B6B6B' }}
                    tickFormatter={(value) => tGlobal.postureParts[value as keyof typeof tGlobal.postureParts] || value}
                    width={40}
                  />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={16}>
                    {postureData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.score >= 90 ? '#22C55E' : entry.score >= 80 ? '#D97D54' : '#EAB308'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Suggestions */}
          <div className={`bg-white rounded-[24px] p-6 shadow-sm ${isVisible ? 'animate-fade-in-up stagger-4' : ''}`} style={{ opacity: isVisible ? 1 : 0 }}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[var(--terracotta)]" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">{t.aiSuggestions}</h3>
            </div>
            <div className="space-y-3">
              {tGlobal.aiSuggestionsMock.map((suggestion, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-[#FDF8F5]">
                  {index < 2 ? (
                    <AlertTriangle className="w-4 h-4 text-[var(--warning)] flex-shrink-0 mt-0.5" />
                  ) : (
                    <Award className="w-4 h-4 text-[var(--success)] flex-shrink-0 mt-0.5" />
                  )}
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
