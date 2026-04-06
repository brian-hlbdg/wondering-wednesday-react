'use client'

const TOTAL = 120
const RADIUS = 40
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

interface Props {
  secondsRemaining: number
}

export default function LockTimer({ secondsRemaining }: Props) {
  const progress = Math.max(0, Math.min(1, secondsRemaining / TOTAL))
  const dashOffset = CIRCUMFERENCE * (1 - progress)
  const unlocked = secondsRemaining <= 0

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
          {/* Track */}
          <circle
            cx="48" cy="48" r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="6"
          />
          {/* Progress */}
          <circle
            cx="48" cy="48" r={RADIUS}
            fill="none"
            stroke={unlocked ? '#4ade80' : 'white'}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xl font-bold tabular-nums ${unlocked ? 'text-green-400' : 'text-white'}`}>
            {unlocked ? '✓' : secondsRemaining}
          </span>
        </div>
      </div>
      <p className="text-xs text-zinc-400">
        {unlocked ? 'Ready to advance' : 'Keep talking…'}
      </p>
    </div>
  )
}
