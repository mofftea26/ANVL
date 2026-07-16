import { useMemo, useState } from 'react'
import { BadgeCheck, Star } from 'lucide-react'
import { useOwnedPassportsQuery } from '@/features/passport/hooks/usePassport'
import {
  useDeleteReviewMutation,
  useProductReviewsQuery,
  useSubmitReviewMutation,
} from '@/features/passport/hooks/useArmory'
import type { ProductReview } from '@/features/passport/schemas/passport.schema'
import { cn } from '@/shared/lib/cn'

/**
 * Verified-owner reviews on the PDP. Everyone reads them; only a signed-in
 * customer who holds a registered passport for THIS product can write one —
 * proven server-side by the submit RPC, so every review is a genuine "Verified
 * owner". The form only appears for those owners.
 */
export function PdpReviews({ slug }: { slug: string }) {
  const reviewsQuery = useProductReviewsQuery(slug)
  const ownedQuery = useOwnedPassportsQuery()
  const reviews = reviewsQuery.data ?? []

  const ownsProduct = (ownedQuery.data ?? []).some((p) => p.productSlug === slug)
  const mine = reviews.find((r) => r.isMine) ?? null

  const summary = useMemo(() => {
    if (reviews.length === 0) return null
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    return { avg, count: reviews.length }
  }, [reviews])

  if (reviewsQuery.isLoading) return null
  // Nothing to show and nobody who can write one — stay out of the way.
  if (reviews.length === 0 && !ownsProduct) return null

  return (
    <section className="mx-auto mt-12 w-full max-w-5xl px-4 sm:px-6">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="anvl-heading text-2xl text-[var(--shop-text)]">Owner reviews</h2>
        {summary ? (
          <p className="flex items-center gap-2 text-sm text-[var(--shop-text-muted)]">
            <StarRating value={Math.round(summary.avg)} />
            <span className="font-semibold text-[var(--shop-text)]">
              {summary.avg.toFixed(1)}
            </span>
            <span>
              · {summary.count} {summary.count === 1 ? 'review' : 'reviews'}
            </span>
          </p>
        ) : null}
      </div>

      {ownsProduct ? <ReviewForm slug={slug} existing={mine} /> : null}

      <ul className="mt-6 space-y-4">
        {reviews.map((review, i) => (
          <ReviewCard key={`${review.displayName}-${i}`} review={review} />
        ))}
      </ul>

      {reviews.length === 0 && ownsProduct ? (
        <p className="anvl-micro mt-6 text-[var(--shop-text-muted)]">
          You forged this one — be the first to review it.
        </p>
      ) : null}
    </section>
  )
}

function ReviewCard({ review }: { review: ProductReview }) {
  return (
    <li className="rounded-2xl border border-[var(--shop-card-border)] bg-[var(--shop-card-bg)] p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <StarRating value={review.rating} />
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-success)]">
          <BadgeCheck size={13} aria-hidden="true" /> Verified owner
        </span>
        <span className="anvl-micro ml-auto text-[10px] text-[var(--shop-text-muted)]">
          {new Date(review.createdAt).toLocaleDateString()}
        </span>
      </div>
      {review.title ? (
        <p className="mt-2 text-sm font-semibold text-[var(--shop-text)]">{review.title}</p>
      ) : null}
      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-[var(--shop-text-muted)]">
        {review.body}
      </p>
      <p className="anvl-micro mt-3 text-[10px] text-[var(--shop-text-muted)]">
        — {review.displayName}
      </p>
    </li>
  )
}

function ReviewForm({ slug, existing }: { slug: string; existing: ProductReview | null }) {
  const submit = useSubmitReviewMutation(slug)
  const remove = useDeleteReviewMutation(slug)
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(existing?.rating ?? 5)
  const [title, setTitle] = useState(existing?.title ?? '')
  const [body, setBody] = useState(existing?.body ?? '')
  const [displayName, setDisplayName] = useState(existing?.displayName ?? '')

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="focus-ring inline-flex items-center gap-2 rounded-full border border-[var(--shop-card-border)] bg-[var(--shop-card-bg)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--shop-text)] motion-safe:transition-colors hover:border-[var(--shop-accent)]"
      >
        <Star size={13} aria-hidden="true" className="text-[var(--shop-accent)]" />
        {existing ? 'Edit your review' : 'Write a review'}
      </button>
    )
  }

  const canSubmit = body.trim().length > 0 && displayName.trim().length > 0 && !submit.isPending

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!canSubmit) return
        submit.mutate(
          { rating, title: title.trim(), body: body.trim(), displayName: displayName.trim() },
          { onSuccess: (r) => r.ok && setOpen(false) },
        )
      }}
      className="rounded-2xl border border-[var(--shop-card-border)] bg-[var(--shop-card-bg)] p-5"
    >
      <div className="flex items-center gap-3">
        <span className="anvl-micro text-[10px] text-[var(--shop-text-muted)]">Your rating</span>
        <StarRating value={rating} onChange={setRating} />
      </div>
      <input
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        maxLength={120}
        placeholder="Display name"
        aria-label="Display name"
        className="focus-ring mt-3 w-full rounded-lg border border-[var(--shop-card-border)] bg-[var(--shop-bg)] px-3 py-2 text-base text-[var(--shop-text)] placeholder:text-[var(--shop-text-muted)] md:text-sm"
      />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={120}
        placeholder="Title (optional)"
        aria-label="Review title"
        className="focus-ring mt-3 w-full rounded-lg border border-[var(--shop-card-border)] bg-[var(--shop-bg)] px-3 py-2 text-base text-[var(--shop-text)] placeholder:text-[var(--shop-text-muted)] md:text-sm"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={2000}
        rows={4}
        placeholder="How does it hold up under pressure?"
        aria-label="Review"
        className="focus-ring mt-3 w-full resize-y rounded-lg border border-[var(--shop-card-border)] bg-[var(--shop-bg)] px-3 py-2 text-base text-[var(--shop-text)] placeholder:text-[var(--shop-text-muted)] md:text-sm"
      />
      {submit.data && !submit.data.ok ? (
        <p className="anvl-micro mt-2 text-[10px] text-[var(--color-destructive)]">
          Only registered owners can review this piece.
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className="focus-ring rounded-full bg-[var(--shop-accent)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--shop-bg)] disabled:opacity-50"
        >
          {existing ? 'Save review' : 'Post review'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="focus-ring rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--shop-text-muted)] motion-safe:transition-colors hover:text-[var(--shop-text)]"
        >
          Cancel
        </button>
        {existing ? (
          <button
            type="button"
            onClick={() => remove.mutate(undefined, { onSuccess: () => setOpen(false) })}
            disabled={remove.isPending}
            className="focus-ring ml-auto rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-destructive)] disabled:opacity-40"
          >
            Delete
          </button>
        ) : null}
      </div>
    </form>
  )
}

/** Star row — display-only, or interactive when `onChange` is given. */
function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const interactive = typeof onChange === 'function'
  return (
    <span className={cn('inline-flex items-center gap-0.5', interactive && 'cursor-pointer')}>
      {[1, 2, 3, 4, 5].map((n) =>
        interactive ? (
          <button
            key={n}
            type="button"
            onClick={() => onChange?.(n)}
            aria-label={`${n} star${n === 1 ? '' : 's'}`}
            className="focus-ring rounded"
          >
            <Star
              size={18}
              aria-hidden="true"
              className={
                n <= value
                  ? 'fill-[var(--shop-accent)] text-[var(--shop-accent)]'
                  : 'text-[var(--shop-text-muted)]'
              }
            />
          </button>
        ) : (
          <Star
            key={n}
            size={14}
            aria-hidden="true"
            className={
              n <= value
                ? 'fill-[var(--shop-accent)] text-[var(--shop-accent)]'
                : 'text-[var(--shop-text-muted)]'
            }
          />
        ),
      )}
    </span>
  )
}
