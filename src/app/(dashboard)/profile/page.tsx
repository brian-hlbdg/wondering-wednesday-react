// src/app/(dashboard)/profile/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import type { Answer, Question } from '@/types';

interface AnswerWithStats extends Answer {
  question: Question | null;
  votes: Array<{ count: number }>;
  discussions: Array<{ count: number }>;
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('users_profile')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get user's answers with stats
  const { data: answers } = await supabase
    .from('answers')
    .select(`
      *,
      question:questions(question_text, is_active, id),
      discussions(count),
      votes(count)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const typedAnswers = (answers || []) as unknown as AnswerWithStats[];

  // Calculate stats
  const totalAnswers = typedAnswers.length;
  const totalVotes = typedAnswers.reduce((sum, a) => sum + (a.votes?.[0]?.count || 0), 0);
  const totalDiscussions = typedAnswers.reduce((sum, a) => sum + (a.discussions?.[0]?.count || 0), 0);

  // Find answer with most responses
  const mostDiscussedAnswer = typedAnswers.reduce((max, curr) => {
    const currCount = curr.discussions?.[0]?.count || 0;
    const maxCount = max?.discussions?.[0]?.count || 0;
    return currCount > maxCount ? curr : max;
  }, typedAnswers[0]);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-3xl font-bold text-white">
              {profile?.username?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">@{profile?.username}</h1>
            <p className="text-gray-600">
              Member since {new Date(profile?.created_at || '').toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Total Answers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{totalAnswers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Total Votes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-blue-600">{totalVotes}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Total Discussions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-green-600">{totalDiscussions}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Most Discussed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-purple-600">
              {mostDiscussedAnswer?.discussions?.[0]?.count || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">responses</p>
          </CardContent>
        </Card>
      </div>

      {/* Most Discussed Answer Highlight */}
      {mostDiscussedAnswer && (mostDiscussedAnswer.discussions?.[0]?.count || 0) > 0 && (
        <Card className="mb-8 border-2 border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-lg">🏆 Your Most Discussed Answer</CardTitle>
            <p className="text-sm text-gray-600">
              {mostDiscussedAnswer.question?.question_text}
            </p>
          </CardHeader>
          <CardContent>
            <p className="text-gray-800 mb-4">{mostDiscussedAnswer.answer_text}</p>
            <div className="flex gap-4 text-sm text-gray-600">
              <span>👍 {mostDiscussedAnswer.votes?.[0]?.count || 0} votes</span>
              <span>💬 {mostDiscussedAnswer.discussions?.[0]?.count || 0} discussions</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Answers */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Your Answers ({totalAnswers})</h2>
        
        {typedAnswers.length > 0 ? (
          <div className="space-y-4">
            {typedAnswers.map(answer => (
              <Card key={answer.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {answer.question?.question_text}
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        Answered {new Date(answer.created_at).toLocaleDateString()}
                        {answer.updated_at !== answer.created_at && (
                          <span> • Edited {new Date(answer.updated_at).toLocaleDateString()}</span>
                        )}
                      </p>
                    </div>
                    {answer.question?.is_active && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Active
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-800 mb-4">{answer.answer_text}</p>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>👍 {answer.votes?.[0]?.count || 0} votes</span>
                    <span>💬 {answer.discussions?.[0]?.count || 0} discussions</span>
                  </div>
                  {answer.question?.is_active && (
                    <Link 
                      href="/current"
                      className="inline-block mt-4 text-sm text-blue-600 hover:underline"
                    >
                      View discussion →
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-600 mb-4">You haven't answered any questions yet.</p>
              <Link 
                href="/current"
                className="text-blue-600 hover:underline font-semibold"
              >
                Answer this week's question →
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}