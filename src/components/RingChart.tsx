import { useEffect, useState } from 'react'

interface RingChartProps {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  color?: string
  bgColor?: string
  label?: string
  delay?: number
}

export default function RingChart({
  value,
  max,
  size = 120,
  strokeWidth = 8,
  color = '#D97D54',
  bgColor = '#F0F0F0',
  label,
  delay = 0,
}: RingChartProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const percentage = Math.min((value / max) * 100, 100)
  const dashOffset = circumference - (percentage / 100) * circumference
  const [animatedOffset, setAnimatedOffset] = useState(circumference)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedOffset(dashOffset)
    }, delay)
    return () => clearTimeout(timer)
  }, [dashOffset, delay])

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animatedOffset}
          style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
          {Math.round(percentage)}%
        </span>
        {label && (
          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mt-0.5">
            {label}
          </span>
        )}
      </div>
    </div>
  )
}
