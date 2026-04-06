// src/app/(dashboard)/archive/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import type { Question } from '@/types';

interface QuestionWithStats extends Question {
  answers: Array<{ count: number }>;
}

export default async function ArchivePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get all past questions (not active, but has been active before)
  const { data: questions } = await supabase
    .from('questions')
    .select(`
      *,
      answers(count)
    `)
    .eq('is_active', false)
    .not('active_from', 'is', null)
    .order('active_from', { ascending: false });

  const typedQuestions = (questions || []) as unknown as QuestionWithStats[];

  // Get user's answered question IDs
  const { data: userAnswers } = await supabase
    .from('answers')
    .select('question_id')
    .eq('user_id', user.id);

  const answeredQuestionIds = new Set(userAnswers?.map(a => a.question_id));

  // Get all unanswered questions (never been active)
  const { data: upcomingQuestions } = await supabase
    .from('questions')
    .select('*')
    .is('active_from', null)
    .eq('is_active', false)
    .order('created_at', { ascending: true })
    .limit(3);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Question Archive</h1>
        <p className="text-gray-600">
          Browse past questions and see how the community responded
        </p>
      </div>

      {/* Past Questions */}
      <div className="space-y-4 mb-12">
        {typedQuestions.length > 0 ? (
          typedQuestions.map(question => {
            const hasAnswered = answeredQuestionIds.has(question.id);
            const answerCount = question.answers?.[0]?.count || 0;

            return (
              <Card key={question.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">
                        {question.question_text}
                      </CardTitle>
                      <div className="flex gap-2 items-center text-sm text-gray-500">
                        <span>
                          Active: {new Date(question.active_from || '').toLocaleDateString()}
                        </span>
                        {question.active_until && (
                          <>
                            <span>→</span>
                            <span>{new Date(question.active_until).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {hasAnswered && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Answered
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      {answerCount} {answerCount === 1 ? 'answer' : 'answers'}
                    </p>
                    <Link href={`/archive/${question.id}`}>
                      <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                        {hasAnswered ? 'View Answers' : 'Answer & View'} →
                      </button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-600">No archived questions yet.</p>
              <p className="text-sm text-gray-500 mt-2">
                Questions will appear here after they rotate out.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upcoming Questions Preview */}
      {upcomingQuestions && upcomingQuestions.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Coming Soon</h2>
          <p className="text-sm text-gray-600 mb-4">
            Sneak peek at upcoming questions
          </p>
          <div className="space-y-3">
            {upcomingQuestions.map((question, index) => (
              <Card key={question.id} className="bg-gray-50 border-dashed">
                <CardContent className="py-4">
                  <div className="flex gap-3 items-start">
                    <Badge variant="outline" className="mt-1">
                      #{index + 1}
                    </Badge>
                    <p className="text-gray-700">{question.question_text}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}