/** Minimal scroll affordance — a thin descending line that loops gently. */
export function ScrollCue() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none flex flex-col items-center gap-2 text-[var(--color-text-muted)]"
    >
      <span className="anvl-micro text-[10px]">Scroll</span>
      <span className="relative block h-10 w-px overflow-hidden bg-[var(--color-line)]">
        <span className="absolute inset-x-0 top-0 h-4 animate-[anvl-scrollcue_1.8s_ease-in-out_infinite] bg-[var(--color-accent)]" />
      </span>
    </div>
  )
}
