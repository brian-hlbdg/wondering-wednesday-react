import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CreateSessionForm from '@/components/play/CreateSessionForm'

export default async function NewSessionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users_profile')
    .select('username')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-1">New Session</h1>
        <p className="text-zinc-400 text-sm mb-8">
          Pick your vibe and share the code to get everyone in.
        </p>
        <CreateSessionForm userId={user.id} displayName={profile?.username ?? 'Host'} />
      </div>
    </div>
  )
}
