import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface Props {
  params: Promise<{ roomCode: string }>
}

export default async function RoomRedirectPage({ params }: Props) {
  const { roomCode } = await params
  const supabase = await createClient()

  const { data: session } = await supabase
    .from('play_sessions')
    .select('status')
    .eq('room_code', roomCode.toUpperCase())
    .single()

  if (!session) redirect('/play/join')

  switch (session.status) {
    case 'lobby':
      redirect(`/play/${roomCode}/lobby`)
    case 'active':
      redirect(`/play/${roomCode}/session`)
    case 'ended':
      redirect(`/play/${roomCode}/ended`)
    default:
      redirect(`/play/${roomCode}/lobby`)
  }
}
