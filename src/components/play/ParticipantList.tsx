'use client'

import type { PlayParticipant } from '@/types'

interface Props {
  participants: PlayParticipant[]
  currentAskerIndex?: number
  currentUserId?: string | null
}

export default function ParticipantList({ participants, currentAskerIndex, currentUserId }: Props) {
  const active = participants.filter((p) => !p.left_at).sort((a, b) => a.join_order - b.join_order)

  return (
    <ul className="space-y-3 w-full">
      {active.map((p, idx) => {
        const isAsker = currentAskerIndex !== undefined && idx === currentAskerIndex % Math.max(active.length, 1)
        const isYou = p.user_id === currentUserId

        return (
          <li
            key={p.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
              isAsker ? 'bg-white/15 border border-white/20' : 'bg-white/5'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold uppercase shrink-0">
              {p.display_name[0]}
            </div>
            <span className="font-medium flex-1 truncate">
              {p.display_name}
              {isYou && <span className="text-zinc-400 font-normal"> (you)</span>}
            </span>
            {p.is_host && (
              <span className="text-xs text-zinc-400">host</span>
            )}
            {isAsker && (
              <span className="text-xs bg-white text-black px-2 py-0.5 rounded-full font-semibold">asking</span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
