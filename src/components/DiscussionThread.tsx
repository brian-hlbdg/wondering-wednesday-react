// src/components/DiscussionThread.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { DiscussionWithUser } from '@/types';

interface DiscussionThreadProps {
  answerId: string;
  initialDiscussions: DiscussionWithUser[];
  currentUserId: string;
  onDiscussionAdded?: () => void; // Callback for when discussion is added
}

export function DiscussionThread({ 
  answerId, 
  initialDiscussions, 
  currentUserId,
  onDiscussionAdded
}: DiscussionThreadProps) {
  const [discussions, setDiscussions] = useState(initialDiscussions);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { data, error: insertError } = await supabase
        .from('discussions')
        .insert({
          answer_id: answerId,
          user_id: currentUserId,
          comment_text: newComment,
        })
        .select(`
          *,
          user:users_profile(*)
        `)
        .single();

      if (insertError) throw insertError;

      setDiscussions(prev => [...prev, data as DiscussionWithUser]);
      setNewComment('');
      setSuccess(true);

      // Call callback if provided
      if (onDiscussionAdded) {
        setTimeout(() => {
          onDiscussionAdded();
        }, 1000); // Small delay to show success message
      }

      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post discussion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 mt-4 pl-4 border-l-2 border-gray-200">
      <h4 className="text-sm font-semibold text-gray-700">
        Discussions ({discussions.length})
      </h4>

      {/* Existing discussions */}
      <div className="space-y-3">
        {discussions.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            No discussions yet. Start the conversation!
          </p>
        ) : (
          discussions.map(discussion => (
            <Card key={discussion.id} className="bg-gray-50">
              <CardHeader className="flex flex-row items-center gap-3 py-3 px-4">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-gray-300">
                    {discussion.user?.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">@{discussion.user?.username}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(discussion.created_at).toLocaleString()}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="py-2 px-4">
                <p className="text-sm text-gray-800">{discussion.comment_text}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* New comment form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add to the discussion..."
          rows={3}
          required
          minLength={1}
          className="resize-none"
        />
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-600 text-sm font-medium">✓ Discussion posted!</p>}
          </div>
          <Button type="submit" disabled={loading} size="sm">
            {loading ? 'Posting...' : 'Post Discussion'}
          </Button>
        </div>
      </form>
    </div>
  );
}