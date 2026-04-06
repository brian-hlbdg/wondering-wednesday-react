const CATEGORY_LABELS: Record<string, string> = {
  date: 'Date',
  friend_group: 'Friends',
  deep: 'Deep',
  party: 'Party',
}

interface Props {
  questionText: string
  category: string
  questionIndex: number
}

export default function QuestionCard({ questionText, category, questionIndex }: Props) {
  return (
    <div className="w-full rounded-2xl bg-white/8 border border-white/10 px-6 py-8 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-400 font-medium uppercase tracking-widest">
          {CATEGORY_LABELS[category] ?? category}
        </span>
        <span className="text-xs text-zinc-500">#{questionIndex}</span>
      </div>
      <p className="text-2xl font-semibold leading-snug text-white">
        {questionText}
      </p>
    </div>
  )
}
