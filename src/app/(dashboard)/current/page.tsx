// src/app/(dashboard)/current/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Answer, UserProfile } from '@/types';
import { AnswerForm } from '@/components/AnswerForm';
import { EditAnswerDialog } from '@/components/EditAnswerDialog';
import { VotingButton } from '@/components/VotingButton';

// Extended type for answers with joined data
interface AnswerWithRelations extends Answer {
  user: UserProfile | null;
  votes: Array<{ count: number }>;
  discussions: Array<{ count: number }>;
}

export default async function CurrentQuestionPage() {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Get active question
  const { data: question } = await supabase
    .from('questions')
    .select('*')
    .eq('is_active', true)
    .single();

  if (!question) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900">
          No active question this week!
        </h1>
        <p className="text-gray-600 mt-2">
          Check back on Wednesday at 9am for the next question.
        </p>
      </div>
    );
  }

  // Get user's answer (if exists)
  const { data: userAnswer } = await supabase
    .from('answers')
    .select('*')
    .eq('question_id', question.id)
    .eq('user_id', user.id)
    .maybeSingle();

  // Get all answers with stats
  const { data: answers } = await supabase
    .from('answers')
    .select(`
      *,
      user:users_profile(username),
      votes(count),
      discussions(count)
    `)
    .eq('question_id', question.id)
    .order('created_at', { ascending: false });

  // Get user's votes for these answers
  const { data: userVotes } = await supabase
    .from('votes')
    .select('answer_id')
    .eq('user_id', user.id)
    .in('answer_id', answers?.map(a => a.id) || []);

  const votedAnswerIds = new Set(userVotes?.map(v => v.answer_id) || []);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Question Header */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {question.question_text}
        </h1>
        <p className="text-sm text-gray-500">
          This week's question • {answers?.length || 0} answers
        </p>
      </div>

      {/* User's Answer Section */}
      {!userAnswer ? (
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-xl font-semibold mb-4">Share Your Answer</h2>
          <p className="text-gray-600 mb-4">
            You haven't answered this question yet. What do you think?
          </p>
          <AnswerForm questionId={question.id} />
        </div>
      ) : (
        <div className="bg-blue-50 rounded-lg shadow-sm p-8 mb-8 border-2 border-blue-200">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-xl font-semibold text-blue-900">Your Answer</h2>
            <EditAnswerDialog 
              questionId={question.id} 
              answer={userAnswer} 
            />
          </div>
          <p className="text-gray-800 text-lg">{userAnswer.answer_text}</p>
          <p className="text-sm text-gray-500 mt-4">
            Posted {new Date(userAnswer.created_at).toLocaleDateString()}
            {userAnswer.updated_at !== userAnswer.created_at && (
              <span> • Edited {new Date(userAnswer.updated_at).toLocaleDateString()}</span>
            )}
          </p>
        </div>
      )}

      {/* All Answers */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">
          Community Answers ({answers?.length || 0})
        </h2>
        
        {answers && answers.length > 0 ? (
          <div className="space-y-4">
            {answers.map((answer) => {
              const typedAnswer = answer as unknown as AnswerWithRelations;
              const isOwnAnswer = answer.user_id === user.id;
              const voteCount = typedAnswer.votes?.[0]?.count || 0;
              const discussionCount = typedAnswer.discussions?.[0]?.count || 0;
              const hasVoted = votedAnswerIds.has(answer.id);
              
              return (
                <div 
                  key={answer.id} 
                  className={`rounded-lg shadow-sm p-6 ${
                    isOwnAnswer ? 'bg-blue-50 border-2 border-blue-200' : 'bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">
                        @{typedAnswer.user?.username || 'Unknown'}
                        {isOwnAnswer && (
                          <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(answer.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-gray-800 mb-4">{answer.answer_text}</p>
                  
                  <div className="flex gap-4 items-center">
                    <VotingButton
                      answerId={answer.id}
                      userId={user.id}
                      initialVoteCount={voteCount}
                      hasVoted={hasVoted}
                    />
                    <span className="text-sm text-gray-600">
                      💬 {discussionCount} discussions
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-600">
              No answers yet. Be the first to share your thoughts!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}