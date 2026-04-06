import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

interface Props {
  params: Promise<{ roomCode: string }>
}

export default async function EndedPage({ params }: Props) {
  const { roomCode } = await params
  const code = roomCode.toUpperCase()
  const supabase = await createClient()

  const { data: session } = await supabase
    .from('play_sessions')
    .select('question_index')
    .eq('room_code', code)
    .single()

  const count = session?.question_index ?? 0

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <p className="text-5xl mb-6">✓</p>
      <h1 className="text-3xl font-bold mb-3">That&apos;s a wrap</h1>
      <p className="text-zinc-400 mb-2">
        You got through <span className="text-white font-semibold">{count}</span> question{count !== 1 ? 's' : ''}.
      </p>
      <p className="text-zinc-500 text-sm mb-10">Hope it sparked something good.</p>
      <Link
        href="/play/new"
        className="bg-white text-black font-semibold px-6 py-3 rounded-full text-sm"
      >
        Start another session
      </Link>
    </div>
  )
}
