import { useState, useEffect, useRef } from 'react'
import { Send, Sparkles, User, Heart, Activity, Zap, Clock, TrendingUp, Camera, ChevronRight } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useUser } from '../contexts/UserContext'
import type { Language } from '../contexts/LanguageContext'
import { translations } from '../i18n'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export default function Chat() {
  const { language: selectedLanguage, setLanguage: setSelectedLanguage } = useLanguage()
  const { user, bmi } = useUser()
  const t = translations[selectedLanguage].chat
  
  const getInitialMessages = (lang: Language): Message[] => [{
    id: 1,
    role: 'assistant',
    content: translations[lang].chat.initialMessage.replace(/\{name\}/g, user.name),
    timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
  }]

  const [messages, setMessages] = useState<Message[]>(getInitialMessages(selectedLanguage))
  const [inputValue, setInputValue] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [selectedModel, setSelectedModel] = useState('moonshotai/kimi-k2.6')
  const [isRealBpm, setIsRealBpm] = useState(false)
  const [realBpm, setRealBpm] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRealBpm) {
      interval = setInterval(async () => {
        try {
          const res = await fetch('/api/bpm');
          if (res.ok) {
            const data = await res.json();
            if (data.bpm !== null) setRealBpm(data.bpm);
          }
        } catch (e) {
          console.error('Failed to fetch BPM', e);
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRealBpm])

  const quickQuestions = [
    { icon: Heart, label: t.q1Label, question: t.q1Question.replace(/\{name\}/g, user.name) },
    { icon: Activity, label: t.q2Label, question: t.q2Question.replace(/\{name\}/g, user.name) },
    { icon: Zap, label: t.q3Label, question: t.q3Question },
    { icon: TrendingUp, label: t.q4Label, question: t.q4Question },
  ]

  // Update initial message when language changes if it's the only message
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'assistant') {
      setMessages(getInitialMessages(selectedLanguage))
    }
  }, [selectedLanguage])

  useEffect(() => {
    setIsVisible(true)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = async (text: string = inputValue) => {
    if (!text.trim()) return

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    }

    const newMessages = [...messages, userMessage];
    setMessages(newMessages)
    setInputValue('')
    setIsTyping(true)

    try {
      // Create api message history
      const languageMap: Record<string, string> = {
        'zh-TW': '繁體中文',
        'zh-CN': '简体中文',
        'en': 'English'
      };
      
      const systemPrompt = `你是一个专业的健康AI助手，主要负责帮助${user.age}岁的${user.name}分析运动数据、解答健康问题、提供锻炼建议。他的身高是${user.height}cm，体重是${user.weight}kg，BMI为${bmi.toFixed(1)}。请用温和、关切、简单易懂的语气回答。请务必使用 ${languageMap[selectedLanguage]} 回复。`;

      const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...newMessages.map(m => ({ role: m.role, content: m.content }))
      ];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: apiMessages
        })
      });

      if (!response.ok) throw new Error('API Error');

      const data = await response.json();
      const aiResponseContent = data.choices?.[0]?.message?.content || t.emptyResponse;

      const aiMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: aiResponseContent,
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: t.error,
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className={`h-screen flex transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="px-8 py-5 border-b border-[var(--border)]/50 bg-white/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--terracotta)]/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[var(--terracotta)]" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[var(--text-primary)]">{t.title}</h1>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                <span className="text-xs text-[var(--text-muted)]">{t.online}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as Language)}
              className="px-3 py-1.5 bg-white border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--terracotta)]/20"
            >
              <option value="zh-TW">繁體中文</option>
              <option value="zh-CN">简体中文</option>
              <option value="en">English</option>
            </select>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="px-3 py-1.5 bg-white border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--terracotta)]/20"
            >
              <option value="moonshotai/kimi-k2.6">Kimi (K2.6)</option>
              <option value="deepseek-ai/deepseek-v4-pro">DeepSeek (V4 Pro)</option>
              <option value="z-ai/glm-5.1">GLM (5.1)</option>
              <option value="minimaxai/minimax-m2.7">MiniMax (M2.7)</option>
            </select>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                  message.role === 'assistant' 
                    ? 'bg-[var(--terracotta)]/10' 
                    : 'bg-[var(--text-primary)]'
                }`}>
                  {message.role === 'assistant' ? (
                    <Sparkles className="w-4 h-4 text-[var(--terracotta)]" />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>

                {/* Message Bubble */}
                <div className={`max-w-[80%] ${
                  message.role === 'assistant' 
                    ? 'chat-bubble-ai' 
                    : 'chat-bubble-user'
                } px-5 py-3.5`}>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className={`text-[10px] mt-2 ${
                    message.role === 'assistant' ? 'text-[var(--text-muted)]' : 'text-white/70'
                  }`}>
                    {message.timestamp}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--terracotta)]/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-[var(--terracotta)]" />
                </div>
                <div className="chat-bubble-ai px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Quick Questions */}
        {messages.length <= 2 && (
          <div className="px-8 pb-4">
            <div className="max-w-3xl mx-auto">
              <p className="text-xs text-[var(--text-muted)] mb-3">{t.quickQuestionsTitle}</p>
              <div className="grid grid-cols-4 gap-3">
                {quickQuestions.map((item, index) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={index}
                      onClick={() => handleSend(item.question)}
                      className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-left"
                    >
                      <Icon className="w-4 h-4 text-[var(--terracotta)] flex-shrink-0" />
                      <span className="text-sm text-[var(--text-primary)]">{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="px-8 py-4 border-t border-[var(--border)]/50 bg-white/50">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={t.inputPlaceholder.replace(/\{name\}/g, user.name)}
                className="w-full px-5 py-3.5 bg-white rounded-2xl border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--terracotta)]/20 focus:border-[var(--terracotta)] transition-all"
              />
            </div>
            <button
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isTyping}
              className={`
                w-12 h-12 rounded-2xl flex items-center justify-center transition-all
                ${inputValue.trim() && !isTyping
                  ? 'bg-[var(--terracotta)] text-white hover:bg-[var(--terracotta-dark)] hover:shadow-lg' 
                  : 'bg-gray-100 text-[var(--text-muted)] cursor-not-allowed'
                }
              `}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel: Health Summary */}
      <div className={`w-80 bg-white border-l border-[var(--border)]/50 p-6 overflow-y-auto ${isVisible ? 'animate-fade-in-up stagger-2' : ''}`} style={{ opacity: isVisible ? 1 : 0 }}>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">{translations[selectedLanguage].dashboard.todayReport}</h3>

        {/* Mini Stats */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FDF8F5]">
            <div className="w-9 h-9 rounded-lg bg-[var(--terracotta)]/10 flex items-center justify-center flex-shrink-0">
              <Heart className="w-4 h-4 text-[var(--terracotta)]" />
            </div>
            <div className="w-full flex items-center justify-between">
              <div>
                <p className="text-xs text-[var(--text-muted)]">{translations[selectedLanguage].dashboard.avgHeartRate}</p>
                <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                  {isRealBpm ? (realBpm !== null ? realBpm : '--') : 105} BPM
                </p>
              </div>
              <button 
                onClick={() => setIsRealBpm(!isRealBpm)}
                className="text-[10px] px-2 py-1 bg-white border border-[var(--terracotta)]/30 rounded text-[var(--terracotta)] hover:bg-[var(--terracotta)] hover:text-white transition-colors whitespace-nowrap"
              >
                {isRealBpm ? t.useFakeData : t.useRealData}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FDF8F5]">
            <div className="w-9 h-9 rounded-lg bg-[var(--terracotta)]/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-[var(--terracotta)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">{translations[selectedLanguage].dashboard.calories}</p>
              <p className="text-sm font-semibold text-[var(--terracotta)] tabular-nums">160 kcal</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FDF8F5]">
            <div className="w-9 h-9 rounded-lg bg-[var(--terracotta)]/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-[var(--terracotta)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">{translations[selectedLanguage].dashboard.duration}</p>
              <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">27 {translations[selectedLanguage].dashboard.minutes}</p>
            </div>
          </div>
        </div>

        {/* Weekly Activity */}
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">{translations[selectedLanguage].records.title}</h3>
        <div className="space-y-3 mb-6">
          {[
            { day: 'Mon', duration: 30, color: 'bg-[var(--terracotta)]' },
            { day: 'Tue', duration: 25, color: 'bg-[var(--terracotta)]' },
            { day: 'Wed', duration: 40, color: 'bg-[var(--terracotta)]' },
            { day: 'Thu', duration: 20, color: 'bg-[var(--terracotta)]' },
            { day: 'Fri', duration: 35, color: 'bg-[var(--terracotta)]' },
            { day: 'Sat', duration: 30, color: 'bg-[var(--terracotta)]' },
            { day: 'Sun', duration: 27, color: 'bg-[var(--terracotta)]' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-[var(--text-muted)] w-8">{item.day}</span>
              <div className="flex-1 h-2 bg-[#F0F0F0] rounded-full overflow-hidden">
                <div 
                  className={`h-full ${item.color} rounded-full transition-all duration-500`}
                  style={{ width: `${(item.duration / 45) * 100}%` }}
                />
              </div>
              <span className="text-xs text-[var(--text-muted)] tabular-nums w-10 text-right">{item.duration}m</span>
            </div>
          ))}
        </div>

        {/* Posture Capture Gallery */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">{translations[selectedLanguage].dashboard.postureCapture}</h3>
            <button className="text-xs text-[var(--terracotta)] hover:underline flex items-center">
              {translations[selectedLanguage].dashboard.viewAll} <ChevronRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 1, date: '05-02', label: translations[selectedLanguage].activities['太极运动'] },
              { id: 2, date: '05-01', label: translations[selectedLanguage].activities['快走'] },
              { id: 3, date: '04-29', label: translations[selectedLanguage].activities['平衡训练'] },
              { id: 4, date: '04-28', label: translations[selectedLanguage].activities['柔韧性训练'] }
            ].map((item) => (
              <div 
                key={item.id} 
                className="aspect-square bg-gray-50 rounded-xl border border-[var(--border)]/50 flex flex-col items-center justify-center relative overflow-hidden group hover:border-[var(--terracotta)]/50 transition-colors cursor-pointer"
              >
                <div className="absolute inset-0 bg-black/5 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                  <Camera className="w-8 h-8 text-gray-300" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-[10px] text-white/90">{item.date}</p>
                  <p className="text-[10px] font-medium text-white truncate">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Robot */}
        <div className="relative">
          <img
            src="/ai-robot.png"
            alt="AI"
            className="w-full h-auto object-contain opacity-80"
          />
        </div>
      </div>
    </div>
  )
}
