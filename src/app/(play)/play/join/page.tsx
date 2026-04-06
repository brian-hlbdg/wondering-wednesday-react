import { createClient } from '@/lib/supabase/server'
import JoinForm from '@/components/play/JoinForm'

interface Props {
  searchParams: Promise<{ code?: string }>
}

export default async function JoinSessionPage({ searchParams }: Props) {
  const { code } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let displayName = ''
  if (user) {
    const { data: profile } = await supabase
      .from('users_profile')
      .select('username')
      .eq('id', user.id)
      .single()
    displayName = profile?.username ?? ''
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-1">Join Session</h1>
        <p className="text-zinc-400 text-sm mb-8">
          Enter the room code to jump in.
        </p>
        <JoinForm
          initialCode={code ?? ''}
          userId={user?.id ?? null}
          displayName={displayName}
        />
      </div>
    </div>
  )
}
