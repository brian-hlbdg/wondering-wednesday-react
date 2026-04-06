'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  PlaySession,
  PlayParticipant,
  SessionQuestion,
  SessionDerivedState,
} from '@/types'

const LOCK_SECONDS = 120

function deriveState(
  session: PlaySession | null,
  participants: PlayParticipant[],
  question: SessionQuestion | null,
  nowMs: number
): SessionDerivedState {
  if (!session) return { phase: 'lobby' }
  if (session.status === 'ended') return { phase: 'ended' }
  if (session.status === 'lobby') return { phase: 'lobby' }

  if (!question) return { phase: 'lobby' }

  const active = participants
    .filter((p) => !p.left_at)
    .sort((a, b) => a.join_order - b.join_order)

  const askerIdx = session.current_asker_index % Math.max(active.length, 1)
  const currentAsker = active[askerIdx] ?? active[0]
  const nextAsker = active[(askerIdx + 1) % active.length] ?? null

  const unlockedAt = session.question_unlocked_at
    ? new Date(session.question_unlocked_at).getTime()
    : null
  const elapsed = unlockedAt ? (nowMs - unlockedAt) / 1000 : LOCK_SECONDS
  const secondsRemaining = Math.max(0, Math.ceil(LOCK_SECONDS - elapsed))

  if (secondsRemaining > 0) {
    return { phase: 'question_locked', secondsRemaining, currentQuestion: question, currentAsker, nextAsker }
  }
  return { phase: 'question_unlocked', currentQuestion: question, currentAsker, nextAsker }
}

interface UsePlaySessionResult {
  session: PlaySession | null
  participants: PlayParticipant[]
  derivedState: SessionDerivedState
  loading: boolean
  error: string | null
  advance: (skip?: boolean, skipReason?: string) => Promise<void>
  startSession: () => Promise<void>
  endSession: () => Promise<void>
}

export function usePlaySession(
  roomCode: string,
  currentUserId: string | null
): UsePlaySessionResult {
  const supabase = createClient()

  const [session, setSession] = useState<PlaySession | null>(null)
  const [participants, setParticipants] = useState<PlayParticipant[]>([])
  const [question, setQuestion] = useState<SessionQuestion | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nowMs, setNowMs] = useState(() => Date.now())

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // Tick every second for the countdown
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  // Fetch the question whenever current_question_id changes
  const fetchQuestion = useCallback(async (questionId: string | null) => {
    if (!questionId) { setQuestion(null); return }
    const { data } = await supabase
      .from('session_questions')
      .select('*')
      .eq('id', questionId)
      .single()
    if (data) setQuestion(data as SessionQuestion)
  }, [supabase])

  // Initial load
  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)

      const { data: sessionData, error: sessionErr } = await supabase
        .from('play_sessions')
        .select('*')
        .eq('room_code', roomCode)
        .single()

      if (sessionErr || !sessionData) {
        if (mounted) setError('Room not found')
        setLoading(false)
        return
      }

      const s = sessionData as PlaySession
      if (mounted) setSession(s)

      const { data: parts } = await supabase
        .from('play_participants')
        .select('*')
        .eq('session_id', s.id)
        .order('join_order')

      if (mounted) setParticipants((parts ?? []) as PlayParticipant[])

      await fetchQuestion(s.current_question_id)

      if (mounted) setLoading(false)
    }

    load()
    return () => { mounted = false }
  }, [roomCode, supabase, fetchQuestion])

  // Realtime subscriptions
  useEffect(() => {
    if (!session) return

    const channel = supabase.channel(`session:${roomCode}`)

    channel
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'play_sessions', filter: `id=eq.${session.id}` },
        (payload) => {
          const updated = payload.new as PlaySession
          setSession(updated)
          fetchQuestion(updated.current_question_id)
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'play_participants', filter: `session_id=eq.${session.id}` },
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
        { event: 'UPDATE', schema: 'public', table: 'play_participants', filter: `session_id=eq.${session.id}` },
        (payload) => {
          setParticipants((prev) =>
            prev.map((p) => p.id === (payload.new as PlayParticipant).id ? payload.new as PlayParticipant : p)
          )
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session?.id, roomCode, supabase, fetchQuestion])

  const advance = useCallback(async (skip = false, skipReason?: string) => {
    if (!session) return
    const { error: rpcErr } = await supabase.rpc('advance_session_question', {
      p_session_id: session.id,
      p_skip: skip,
      p_skip_reason: skipReason ?? null,
    })
    if (rpcErr) setError(rpcErr.message)
  }, [session, supabase])

  const startSession = useCallback(async () => {
    if (!session) return
    const { error: rpcErr } = await supabase.rpc('start_play_session', {
      p_session_id: session.id,
    })
    if (rpcErr) setError(rpcErr.message)
  }, [session, supabase])

  const endSession = useCallback(async () => {
    if (!session) return
    const { error: updateErr } = await supabase
      .from('play_sessions')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', session.id)
    if (updateErr) setError(updateErr.message)
  }, [session, supabase])

  const derivedState = deriveState(session, participants, question, nowMs)

  return { session, participants, derivedState, loading, error, advance, startSession, endSession }
}
