// src/components/VotingButton.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ThumbsUp } from 'lucide-react';

interface VotingButtonProps {
  answerId: string;
  userId: string;
  initialVoteCount: number;
  hasVoted: boolean;
}

export function VotingButton({ 
  answerId, 
  userId, 
  initialVoteCount, 
  hasVoted 
}: VotingButtonProps) {
  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [isVoted, setIsVoted] = useState(hasVoted);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleVote = async () => {
    setLoading(true);

    try {
      if (isVoted) {
        // Remove vote
        const { error } = await supabase
          .from('votes')
          .delete()
          .eq('answer_id', answerId)
          .eq('user_id', userId);
        
        if (error) throw error;
        
        setVoteCount(prev => prev - 1);
        setIsVoted(false);
      } else {
        // Add vote
        const { error } = await supabase
          .from('votes')
          .insert({ answer_id: answerId, user_id: userId });
        
        if (error) throw error;
        
        setVoteCount(prev => prev + 1);
        setIsVoted(true);
      }
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleVote}
      disabled={loading}
      variant={isVoted ? "default" : "outline"}
      size="sm"
      className="flex items-center gap-2"
    >
      <ThumbsUp size={16} className={isVoted ? "fill-current" : ""} />
      <span>{voteCount}</span>
    </Button>
  );
}