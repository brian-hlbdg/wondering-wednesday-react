'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { usePlaySession } from '@/hooks/usePlaySession'
import QuestionCard from './QuestionCard'
import LockTimer from './LockTimer'
import AskerControls from './AskerControls'
import TurnIndicator from './TurnIndicator'
import SessionHeader from './SessionHeader'
import ParticipantList from './ParticipantList'

interface Props {
  roomCode: string
  currentUserId: string
  currentParticipantId: string
}

export default function SessionScreen({ roomCode, currentUserId, currentParticipantId }: Props) {
  const router = useRouter()
  const { session, participants, derivedState, loading, error, advance, endSession } = usePlaySession(roomCode, currentUserId)

  // Redirect when session ends
  useEffect(() => {
    if (derivedState.phase === 'ended') {
      router.replace(`/play/${roomCode}/ended`)
    }
  }, [derivedState.phase, roomCode, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen px-6">
        <p className="text-red-400 text-center">{error}</p>
      </div>
    )
  }

  if (derivedState.phase === 'lobby' || derivedState.phase === 'ended') {
    return null
  }

  const { currentQuestion, currentAsker, nextAsker } = derivedState
  const isMyTurn = currentAsker.user_id === currentUserId
  const isHost = session?.host_user_id === currentUserId
  const active = participants.filter((p) => !p.left_at).sort((a, b) => a.join_order - b.join_order)
  const askerIdx = session ? session.current_asker_index % Math.max(active.length, 1) : 0

  return (
    <div className="flex flex-col min-h-screen">
      <SessionHeader
        roomCode={roomCode}
        questionIndex={session?.question_index ?? 0}
        isHost={isHost}
        onEndSession={endSession}
      />

      <div className="flex-1 flex flex-col px-5 py-6 gap-6">
        <TurnIndicator
          askerName={currentAsker.display_name}
          nextAskerName={nextAsker?.display_name ?? null}
          isYourTurn={isMyTurn}
        />

        <QuestionCard
          questionText={currentQuestion.question_text}
          category={currentQuestion.category}
          questionIndex={session?.question_index ?? 0}
        />

        <div className="flex justify-center">
          <LockTimer
            secondsRemaining={
              derivedState.phase === 'question_locked' ? derivedState.secondsRemaining : 0
            }
          />
        </div>

        {isMyTurn && (
          <AskerControls
            locked={derivedState.phase === 'question_locked'}
            secondsRemaining={
              derivedState.phase === 'question_locked' ? derivedState.secondsRemaining : 0
            }
            onAdvance={() => advance()}
          />
        )}

        <div className="mt-auto">
          <p className="text-xs text-zinc-500 mb-3 text-center uppercase tracking-wider">In the room</p>
          <ParticipantList
            participants={participants}
            currentAskerIndex={askerIdx}
            currentUserId={currentUserId}
          />
        </div>
      </div>
    </div>
  )
}
