'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  initialCode: string
  userId: string | null
  displayName: string
}

export default function JoinForm({ initialCode, userId, displayName }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [code, setCode] = useState(initialCode.toUpperCase())
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleJoin() {
    if (!userId) { setError('You need to be logged in to join a session'); return }
    if (code.length !== 6) { setError('Room codes are 6 characters'); return }

    setLoading(true)
    setError(null)

    // Look up the session
    const { data: session, error: sessionErr } = await supabase
      .from('play_sessions')
      .select('id, status, allow_guests')
      .eq('room_code', code)
      .single()

    if (sessionErr || !session) {
      setError('Room not found — check the code and try again')
      setLoading(false)
      return
    }

    if (session.status === 'ended') {
      setError('This session has already ended')
      setLoading(false)
      return
    }

    // Check if already in session
    const { data: existing } = await supabase
      .from('play_participants')
      .select('id')
      .eq('session_id', session.id)
      .eq('user_id', userId)
      .is('left_at', null)
      .single()

    if (existing) {
      // Already joined — just navigate
      router.push(`/play/${code}`)
      return
    }

    // Get current max join_order
    const { data: maxOrder } = await supabase
      .from('play_participants')
      .select('join_order')
      .eq('session_id', session.id)
      .order('join_order', { ascending: false })
      .limit(1)
      .single()

    const joinOrder = (maxOrder?.join_order ?? -1) + 1

    const { error: joinErr } = await supabase
      .from('play_participants')
      .insert({
        session_id: session.id,
        user_id: userId,
        display_name: displayName,
        is_host: false,
        join_order: joinOrder,
      })

    if (joinErr) {
      setError(joinErr.message)
      setLoading(false)
      return
    }

    router.push(`/play/${code}`)
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="text-sm text-zinc-400 block mb-2">Room code</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
          placeholder="XXXXXX"
          className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-2xl font-mono tracking-widest text-center focus:outline-none focus:border-white/40 uppercase"
          maxLength={6}
          autoComplete="off"
          autoCapitalize="characters"
        />
      </div>

      {!userId && (
        <p className="text-sm text-zinc-400">
          You need an account to join.{' '}
          <a href="/login" className="text-white underline">Log in</a>
        </p>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        onClick={handleJoin}
        disabled={loading || code.length !== 6 || !userId}
        className={`w-full py-4 rounded-full text-base font-semibold transition-all ${
          code.length !== 6 || !userId
            ? 'bg-white/10 text-zinc-500 cursor-not-allowed'
            : 'bg-white text-black active:scale-95'
        }`}
      >
        {loading ? 'Joining…' : 'Join Session'}
      </button>
    </div>
  )
}
