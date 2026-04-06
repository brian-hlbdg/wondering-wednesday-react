import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LobbyScreen from '@/components/play/LobbyScreen'

interface Props {
  params: Promise<{ roomCode: string }>
}

export default async function LobbyPage({ params }: Props) {
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
  if (session.status === 'active') redirect(`/play/${code}/session`)
  if (session.status === 'ended') redirect(`/play/${code}/ended`)

  const { data: participants } = await supabase
    .from('play_participants')
    .select('*')
    .eq('session_id', session.id)
    .order('join_order')

  return (
    <LobbyScreen
      session={session}
      initialParticipants={participants ?? []}
      currentUserId={user.id}
      roomCode={code}
    />
  )
}
