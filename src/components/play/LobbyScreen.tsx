'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ParticipantList from './ParticipantList'
import type { PlaySession, PlayParticipant } from '@/types'

interface Props {
  session: PlaySession
  initialParticipants: PlayParticipant[]
  currentUserId: string
  roomCode: string
}

export default function LobbyScreen({ session, initialParticipants, currentUserId, roomCode }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [participants, setParticipants] = useState<PlayParticipant[]>(initialParticipants)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isHost = session.host_user_id === currentUserId
  const activeCount = participants.filter((p) => !p.left_at).length

  useEffect(() => {
    const channel = supabase.channel(`lobby:${roomCode}`)

    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'play_participants',
          filter: `session_id=eq.${session.id}`,
        },
        (payload) => {
          setParticipants((prev) => {
            const exists = prev.some((p) => p.id === (payload.new as PlayParticipant).id)
            if (exists) return prev
            return [...prev, payload.new as PlayParticipant].sort((a, b) => a.join_order - b.join_order)
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'play_sessions',
          filter: `id=eq.${session.id}`,
        },
        (payload) => {
          const updated = payload.new as PlaySession
          if (updated.status === 'active') {
            router.replace(`/play/${roomCode}/session`)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [session.id, roomCode, router, supabase])

  async function handleStart() {
    setStarting(true)
    setError(null)
    const { error: rpcErr } = await supabase.rpc('start_play_session', {
      p_session_id: session.id,
    })
    if (rpcErr) {
      setError(rpcErr.message)
      setStarting(false)
    }
    // On success, the Realtime UPDATE will trigger the redirect
  }

  return (
    <div className="flex flex-col min-h-screen px-5 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Room code</p>
        <p className="text-5xl font-bold font-mono tracking-widest">{roomCode}</p>
        <p className="text-zinc-400 text-sm mt-2">Share this code to invite people</p>
      </div>

      {/* Category badges */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {session.categories.map((cat) => (
          <span
            key={cat}
            className="px-3 py-1 rounded-full text-xs bg-white/10 text-zinc-300 capitalize"
          >
            {cat.replace('_', ' ')}
          </span>
        ))}
      </div>

      {/* Participants */}
      <div className="flex-1">
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3 text-center">
          {activeCount} {activeCount === 1 ? 'person' : 'people'} in the room
        </p>
        <ParticipantList participants={participants} currentUserId={currentUserId} />
      </div>

      {/* Start button (host only) */}
      {isHost && (
        <div className="mt-8">
          {error && <p className="text-red-400 text-sm text-center mb-3">{error}</p>}
          <button
            onClick={handleStart}
            disabled={starting || activeCount < 2}
            className={`w-full py-4 rounded-full text-base font-semibold transition-all ${
              activeCount < 2
                ? 'bg-white/10 text-zinc-500 cursor-not-allowed'
                : 'bg-white text-black active:scale-95'
            }`}
          >
            {starting ? 'Starting…' : activeCount < 2 ? 'Waiting for others to join…' : 'Start Session'}
          </button>
        </div>
      )}

      {!isHost && (
        <div className="mt-8 text-center">
          <p className="text-zinc-400 text-sm">Waiting for the host to start…</p>
        </div>
      )}
    </div>
  )
}
