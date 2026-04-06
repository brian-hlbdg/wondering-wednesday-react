// src/components/DiscussionDialog.tsx
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { DiscussionThread } from './DiscussionThread';
import type { DiscussionWithUser } from '@/types';
import { useRouter } from 'next/navigation';

interface DiscussionDialogProps {
  answerId: string;
  answerText: string;
  username: string;
  initialDiscussions: DiscussionWithUser[];
  discussionCount: number;
  currentUserId: string;
}

export function DiscussionDialog({ 
  answerId, 
  answerText,
  username,
  initialDiscussions, 
  discussionCount,
  currentUserId 
}: DiscussionDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleDiscussionAdded = () => {
    // Refresh the page to update discussion counts
    router.refresh();
    // Close the dialog after a short delay
    setTimeout(() => {
      setOpen(false);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <MessageCircle size={16} />
          <span>{discussionCount}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Discussion</DialogTitle>
        </DialogHeader>
        
        {/* Original Answer */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">
            @{username}'s answer:
          </p>
          <p className="text-gray-800">{answerText}</p>
        </div>

        {/* Discussion Thread */}
        <DiscussionThread 
          answerId={answerId} 
          initialDiscussions={initialDiscussions}
          currentUserId={currentUserId}
          onDiscussionAdded={handleDiscussionAdded}
        />
      </DialogContent>
    </Dialog>
  );
}