'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { SessionCategory } from '@/types'

const CATEGORIES: { value: SessionCategory; label: string; description: string }[] = [
  { value: 'date', label: 'Date', description: 'Just the two of you' },
  { value: 'friend_group', label: 'Friends', description: 'Casual group hang' },
  { value: 'deep', label: 'Deep', description: 'Real talk, any group size' },
  { value: 'party', label: 'Party', description: 'Icebreakers & laughs' },
]

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

interface Props {
  userId: string
  displayName: string
}

export default function CreateSessionForm({ userId, displayName }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [selected, setSelected] = useState<SessionCategory[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function toggle(cat: SessionCategory) {
    setSelected((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  async function handleCreate() {
    if (selected.length === 0) { setError('Pick at least one category'); return }
    setLoading(true)
    setError(null)

    const roomCode = generateRoomCode()

    const { data: sessionData, error: sessionErr } = await supabase
      .from('play_sessions')
      .insert({
        room_code: roomCode,
        host_user_id: userId,
        categories: selected,
        allow_guests: false,
      })
      .select('id')
      .single()

    if (sessionErr || !sessionData) {
      setError(sessionErr?.message ?? 'Failed to create session')
      setLoading(false)
      return
    }

    // Add host as participant with join_order 0
    const { error: partErr } = await supabase
      .from('play_participants')
      .insert({
        session_id: sessionData.id,
        user_id: userId,
        display_name: displayName,
        is_host: true,
        join_order: 0,
      })

    if (partErr) {
      setError(partErr.message)
      setLoading(false)
      return
    }

    router.push(`/play/${roomCode}/lobby`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-zinc-400 mb-3">What kind of questions?</p>
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map((cat) => {
            const isSelected = selected.includes(cat.value)
            return (
              <button
                key={cat.value}
                onClick={() => toggle(cat.value)}
                className={`flex flex-col items-start p-4 rounded-xl border transition-all text-left ${
                  isSelected
                    ? 'border-white bg-white/10'
                    : 'border-white/15 bg-white/5 hover:bg-white/8'
                }`}
              >
                <span className="font-semibold text-sm">{cat.label}</span>
                <span className="text-xs text-zinc-400 mt-0.5">{cat.description}</span>
              </button>
            )
          })}
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        onClick={handleCreate}
        disabled={loading || selected.length === 0}
        className={`w-full py-4 rounded-full text-base font-semibold transition-all ${
          selected.length === 0
            ? 'bg-white/10 text-zinc-500 cursor-not-allowed'
            : 'bg-white text-black active:scale-95'
        }`}
      >
        {loading ? 'Creating…' : 'Create Room'}
      </button>
    </div>
  )
}
