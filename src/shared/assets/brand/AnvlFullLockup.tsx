import { AnvlWordmark } from './AnvlWordmark'

export function AnvlFullLockup({ className }: { className?: string }) {
  return (
    <div className={className}>
      <AnvlWordmark className="h-8 w-auto" />
      <p className="anvl-micro mt-1">ATHLETICS</p>
    </div>
  )
}
