// src/components/EditAnswerDialog.tsx
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AnswerForm } from './AnswerForm';

interface EditAnswerDialogProps {
  questionId: string;
  answer: {
    id: string;
    answer_text: string;
  };
}

export function EditAnswerDialog({ questionId, answer }: EditAnswerDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false); // Close dialog on success
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Your Answer</DialogTitle>
        </DialogHeader>
        <AnswerForm 
          questionId={questionId} 
          existingAnswer={answer} 
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}