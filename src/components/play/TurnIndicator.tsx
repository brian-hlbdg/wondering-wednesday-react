interface Props {
  askerName: string
  nextAskerName: string | null
  isYourTurn: boolean
}

export default function TurnIndicator({ askerName, nextAskerName, isYourTurn }: Props) {
  return (
    <div className="text-center">
      <p className="text-lg font-semibold">
        {isYourTurn ? 'Your turn to ask' : `${askerName} is asking`}
      </p>
      {nextAskerName && (
        <p className="text-sm text-zinc-400 mt-1">
          Next: {nextAskerName}
        </p>
      )}
    </div>
  )
}
