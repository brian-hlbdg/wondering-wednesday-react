// src/app/(dashboard)/layout.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('users_profile')
    .select('username')
    .eq('id', user.id)
    .single();

  const handleSignOut = async () => {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex gap-8">
              <Link href="/current" className="text-xl font-bold text-gray-900 hover:text-blue-600">
                Wondering Wednesdays
              </Link>
              <div className="flex gap-4">
                <Link 
                  href="/current" 
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Current
                </Link>
                <Link 
                  href="/archive" 
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Archive
                </Link>
                <Link 
                  href="/profile" 
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Profile
                </Link>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Link 
                href="/profile"
                className="text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                @{profile?.username}
              </Link>
              <form action={handleSignOut}>
                <button 
                  type="submit"
                  className="text-sm text-gray-600 hover:text-red-600 font-medium"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}