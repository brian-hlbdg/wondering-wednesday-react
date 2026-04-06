import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SessionScreen from '@/components/play/SessionScreen'

interface Props {
  params: Promise<{ roomCode: string }>
}

export default async function SessionPage({ params }: Props) {
  const { roomCode } = await params
  const code = roomCode.toUpperCase()
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: session } = await supabase
    .from('play_sessions')
    .select('*')
    .eq('room_code', code)
    .single()

  if (!session) redirect('/play/join')
  if (session.status === 'lobby') redirect(`/play/${code}/lobby`)
  if (session.status === 'ended') redirect(`/play/${code}/ended`)

  const { data: participants } = await supabase
    .from('play_participants')
    .select('*')
    .eq('session_id', session.id)
    .order('join_order')

  const { data: currentParticipant } = await supabase
    .from('play_participants')
    .select('id')
    .eq('session_id', session.id)
    .eq('user_id', user.id)
    .is('left_at', null)
    .single()

  if (!currentParticipant) redirect(`/play/join?code=${code}`)

  return (
    <SessionScreen
      roomCode={code}
      currentUserId={user.id}
      currentParticipantId={currentParticipant.id}
    />
  )
}
