// src/components/AnswerForm.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface AnswerFormProps {
  questionId: string;
  existingAnswer?: {
    id: string;
    answer_text: string;
  } | null;
  onSuccess?: () => void; // Add callback for success
}

export function AnswerForm({ questionId, existingAnswer, onSuccess }: AnswerFormProps) {
  const [answerText, setAnswerText] = useState(existingAnswer?.answer_text || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (existingAnswer) {
        // Update existing answer
        const { error: updateError } = await supabase
          .from('answers')
          .update({ 
            answer_text: answerText,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAnswer.id);

        if (updateError) throw updateError;
      } else {
        // Create new answer
        const { error: insertError } = await supabase
          .from('answers')
          .insert({
            question_id: questionId,
            user_id: user.id,
            answer_text: answerText,
          });

        if (insertError) throw insertError;
      }

      setSuccess(true);
      
      // Refresh the page to show new data
      router.refresh();
      
      // Call onSuccess callback (to close dialog)
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 500); // Small delay to show success message
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit answer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        value={answerText}
        onChange={(e) => setAnswerText(e.target.value)}
        placeholder="Share your thoughts..."
        rows={6}
        required
        minLength={10}
        className="w-full resize-none"
      />
      
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {answerText.length} characters
        </p>
        
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm font-medium">✓ Answer saved!</p>}
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading 
          ? 'Submitting...' 
          : existingAnswer 
            ? 'Update Answer' 
            : 'Submit Answer'}
      </Button>
    </form>
  );
}