'use client'

import { useState } from 'react'

interface Props {
  roomCode: string
  questionIndex: number
  isHost: boolean
  onEndSession: () => Promise<void>
}

export default function SessionHeader({ roomCode, questionIndex, isHost, onEndSession }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleEnd() {
    if (!confirming) { setConfirming(true); return }
    setLoading(true)
    try {
      await onEndSession()
    } finally {
      setLoading(false)
      setConfirming(false)
    }
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm font-bold tracking-widest text-zinc-300">{roomCode}</span>
        <span className="text-xs text-zinc-500">Q{questionIndex}</span>
      </div>
      {isHost && (
        <button
          onClick={handleEnd}
          disabled={loading}
          className="text-xs text-zinc-400 hover:text-red-400 transition-colors"
        >
          {confirming ? 'Tap again to end' : 'End session'}
        </button>
      )}
    </div>
  )
}
