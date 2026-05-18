import { cn } from '@/shared/lib/cn'

export const adminReactDayPickerRootClassName = cn(
  'rdp-root mt-0 p-0 text-[var(--color-text)]',
  /* Override library defaults (`style.css` ships `--rdp-accent-color: blue`). */
  '[--rdp-accent-color:var(--color-accent)]',
  '[--rdp-accent-background-color:color-mix(in_srgb,var(--color-accent)_14%,transparent)]',
  '[--rdp-selected-border:transparent]',
  '[--rdp-today-color:color-mix(in_srgb,var(--color-accent)_72%,var(--color-text)_28%)]',
  '[--rdp-day-height:2.125rem]',
  '[--rdp-day-width:2.125rem]',
  '[--rdp-day_button-height:2.125rem]',
  '[--rdp-day_button-width:2.125rem]',
  '[--rdp-day_button-border-radius:0.375rem]',
  '[--rdp-nav-height:2.125rem]',
  '[--rdp-nav_button-height:2.125rem]',
  '[--rdp-nav_button-width:2.125rem]',
  '[--rdp-outside-opacity:0.45]',
)

export const adminReactDayPickerClassNames = {
  months: cn(
    'rdp-months',
    'flex max-h-[min(248px,52dvh)] min-h-0 flex-col gap-2 overflow-x-hidden overflow-y-auto overscroll-y-contain sm:max-h-none sm:overflow-y-visible sm:flex-row',
  ),
  month: cn('rdp-month', 'space-y-2'),
  caption_label: cn(
    'rdp-caption_label',
    'px-1 text-center text-sm font-semibold tabular-nums tracking-tight text-[var(--color-text)]',
  ),
  nav: cn('rdp-nav', 'flex items-center justify-between gap-1'),
  button_previous: cn(
    'rdp-button_previous',
    'focus-ring motion-reduce:transition-none',
  ),
  button_next: cn(
    'rdp-button_next',
    'focus-ring motion-reduce:transition-none',
  ),
  month_caption: cn(
    'rdp-month_caption',
    'items-center justify-center border-0 bg-transparent p-0 font-normal',
  ),
  weekdays: cn('rdp-weekdays', 'flex gap-0.5'),
  weekday: cn(
    'rdp-weekday',
    'flex h-6 min-w-[2.125rem] items-center justify-center px-0 text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]',
  ),
  week: cn('rdp-week', 'mt-0.5 flex w-full gap-0.5'),
  day: cn('rdp-day', 'p-0 text-center text-sm'),
  day_button: cn(
    'rdp-day_button',
    'focus-ring rounded-md font-medium text-[var(--color-text)] motion-reduce:transition-none',
    'hover:bg-[var(--color-chip)]',
  ),
  selected: cn(
    'rdp-selected',
    /* Reset upstream `.rdp-selected { font-size: large }` — selection chrome is on the button. */
    '[&]:font-normal [&_.rdp-day_button]:text-sm',
    '[&_.rdp-day_button]:border-2 [&_.rdp-day_button]:border-[color:color-mix(in_srgb,var(--color-accent)_52%,var(--anvl-bone)_48%)]',
    '[&_.rdp-day_button]:bg-[color-mix(in_srgb,var(--color-accent)_20%,transparent)]',
    '[&_.rdp-day_button]:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--anvl-bone)_20%,transparent)]',
    '[&_.rdp-day_button]:font-semibold [&_.rdp-day_button]:text-[var(--color-text)]',
    '[&_.rdp-day_button]:focus-visible:outline-none [&_.rdp-day_button]:focus-visible:ring-2 [&_.rdp-day_button]:focus-visible:ring-[var(--color-accent)] [&_.rdp-day_button]:focus-visible:ring-offset-2 [&_.rdp-day_button]:focus-visible:ring-offset-[var(--color-bg)]',
  ),
  today: cn(
    'rdp-today',
    '[&_.rdp-day_button]:outline [&_.rdp-day_button]:outline-1 [&_.rdp-day_button]:outline-offset-2',
    '[&_.rdp-day_button]:outline-[color:color-mix(in_srgb,var(--color-accent)_65%,transparent)]',
  ),
  outside: cn('rdp-outside', 'text-[var(--color-text-muted)]'),
  disabled: cn('rdp-disabled', 'opacity-30'),
} as const
