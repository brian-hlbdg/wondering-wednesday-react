'use client'

import { useState } from 'react'

interface Props {
  locked: boolean
  secondsRemaining?: number
  onAdvance: () => Promise<void>
}

export default function AskerControls({ locked, secondsRemaining, onAdvance }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleAdvance() {
    setLoading(true)
    try {
      await onAdvance()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <button
        onClick={handleAdvance}
        disabled={locked || loading}
        className={`w-full py-4 rounded-full text-base font-semibold transition-all ${
          locked
            ? 'bg-white/10 text-zinc-500 cursor-not-allowed'
            : 'bg-white text-black active:scale-95'
        }`}
      >
        {loading ? 'Loading…' : locked ? `Next question in ${secondsRemaining}s` : 'Next Question →'}
      </button>
    </div>
  )
}
