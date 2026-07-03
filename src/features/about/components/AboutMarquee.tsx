/**
 * Counter-scrolling type band between proof and finale: two infinite rows of
 * the CMS marquee text — one outlined (text-stroke, transparent fill), one
 * solid graphite — driven by pure CSS keyframes (`about-marquee` in
 * styles.css). Each row's content is duplicated for a seamless wrap; the
 * duplicate is aria-hidden. Reduced motion pauses the animation via CSS.
 */

const REPEATS_PER_HALF = 4

function MarqueeRow({ text, reverse, outlined }: { text: string; reverse?: boolean; outlined?: boolean }) {
  const chunk = Array.from({ length: REPEATS_PER_HALF }, () => text).join(' — ')
  const rowClass = outlined
    ? 'anvl-heading about-outline-text text-transparent'
    : 'anvl-heading text-[var(--color-graphite,#5B5E61)]'
  return (
    <div className="flex overflow-hidden whitespace-nowrap">
      <div
        data-marquee-track
        className={`flex shrink-0 items-center will-change-transform ${reverse ? 'about-marquee-reverse' : 'about-marquee-forward'}`}
      >
        <span className={`${rowClass} px-4 text-[clamp(2.5rem,7vw,5.5rem)] leading-none`}>{chunk}&nbsp;—&nbsp;</span>
        <span aria-hidden="true" className={`${rowClass} px-4 text-[clamp(2.5rem,7vw,5.5rem)] leading-none`}>
          {chunk}&nbsp;—&nbsp;
        </span>
      </div>
    </div>
  )
}

export function AboutMarquee({ text }: { text: string }) {
  return (
    <div
      data-about-marquee
      aria-hidden="true"
      className="relative z-10 flex select-none flex-col gap-2 overflow-hidden py-10 md:py-14"
    >
      <MarqueeRow text={text} outlined />
      <MarqueeRow text={text} reverse />
    </div>
  )
}
