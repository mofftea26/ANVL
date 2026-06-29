/**
 * Visually-hidden, polite live region announcing the current result count to
 * screen readers after every filter/search/sort change. Separated from the
 * visible count so SR users get an unambiguous "N pieces" update without the
 * decorative chrome.
 */
export function ShopResultAnnouncement({ count }: { count: number }) {
  return (
    <p role="status" aria-live="polite" className="sr-only">
      {count === 0
        ? 'No pieces match the current filters.'
        : `${count} ${count === 1 ? 'piece' : 'pieces'} match the current filters.`}
    </p>
  )
}
