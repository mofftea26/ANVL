import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    className,
    onClick,
  }: {
    to: string
    children: React.ReactNode
    className?: string
    onClick?: () => void
  }) => (
    <a data-tsr="1" href={to} className={className} onClick={onClick}>
      {children}
    </a>
  ),
}))

import { ProductRevealSequence } from '../components/ProductRevealSequence'
import { OATH_DEFAULT_CONTENT } from '../content/oathContent.defaults'

/**
 * Tablet layout contract (768px–1279px): shorter section footprint, wider
 * banner gaps, and enlarged (but not desktop-sized) card sizing — desktop (`xl:`)
 * restores the cinematic min-height and original spacing.
 */
describe('ProductRevealSequence mobile layout', () => {
  function getBanners(container: HTMLElement) {
    return Array.from(container.querySelectorAll<HTMLElement>('[data-banner]'))
  }

  it('places the hero banner on its own row below md with side pieces paired beneath', () => {
    const { container } = render(
      <ProductRevealSequence
        products={[]}
        content={OATH_DEFAULT_CONTENT.products}
      />,
    )
    const grid = container.querySelector('[data-product-reveal] ul')
    const banners = getBanners(container)
    expect(grid).not.toBeNull()
    expect(grid!.className).toMatch(/\bgrid-cols-2\b/)
    expect(grid!.className).toMatch(/\bmd:flex\b/)
    expect(banners[1]!.className).toMatch(/max-md:order-1/)
    expect(banners[1]!.className).toMatch(/max-md:col-span-2/)
    expect(banners[0]!.className).toMatch(/max-md:order-2/)
    expect(banners[2]!.className).toMatch(/max-md:order-3/)
  })

  it('adds horizontal gap between the bottom-row banners on mobile', () => {
    const { container } = render(
      <ProductRevealSequence
        products={[]}
        content={OATH_DEFAULT_CONTENT.products}
      />,
    )
    const grid = container.querySelector('[data-product-reveal] ul')
    expect(grid).not.toBeNull()
    expect(grid!.className).toMatch(/\bmax-md:gap-x-4\b/)
    expect(grid!.className).toMatch(/\bmax-md:justify-items-center\b/)
  })
})

describe('ProductRevealSequence tablet layout', () => {
  it('renders the products heading and three banner slots', () => {
    render(
      <ProductRevealSequence
        products={[]}
        content={OATH_DEFAULT_CONTENT.products}
      />,
    )
    expect(
      screen.getByRole('region', { name: 'The first three pieces' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: OATH_DEFAULT_CONTENT.products.title }),
    ).toBeInTheDocument()
    expect(document.querySelectorAll('[data-banner]')).toHaveLength(3)
  })

  it('uses a compact min-height on tablet and restores full section height on desktop', () => {
    const { container } = render(
      <ProductRevealSequence
        products={[]}
        content={OATH_DEFAULT_CONTENT.products}
      />,
    )
    const section = container.querySelector('[data-scene="products"]')
    expect(section).not.toBeNull()
    expect(section!.className).toContain('min-h-[100svh]')
    expect(section!.className).toContain(
      'md:min-h-[min(76svh,calc(var(--anvl-section-h)*0.82))]',
    )
    expect(section!.className).toContain('xl:min-h-[100svh]')
    expect(section!.className).toContain('md:py-7')
    expect(section!.className).toContain('xl:pb-0')
  })

  it('widens banner gaps on tablet while keeping desktop gap unchanged', () => {
    const { container } = render(
      <ProductRevealSequence
        products={[]}
        content={OATH_DEFAULT_CONTENT.products}
      />,
    )
    const grid = container.querySelector('[data-product-reveal] ul')
    expect(grid).not.toBeNull()
    expect(grid!.className).toMatch(/\bgap-x-6\b/)
    expect(grid!.className).toMatch(/\bgap-y-12\b/)
    expect(grid!.className).toMatch(/\bmd:gap-24\b/)
    expect(grid!.className).toMatch(/\bxl:gap-28\b/)
  })

  it('uses enlarged tablet banner sizing without changing mobile or desktop', () => {
    const { container } = render(
      <ProductRevealSequence
        products={[]}
        content={OATH_DEFAULT_CONTENT.products}
      />,
    )
    const banner = container.querySelector('[data-banner]')
    expect(banner).not.toBeNull()
    expect(banner!.className).toContain('max-w-[14.5rem]')
    expect(banner!.className).toContain('max-md:max-w-[10.75rem]')
    expect(banner!.className).toContain('md:max-w-[clamp(14rem,21vw,17rem)]')
    expect(banner!.className).toContain('xl:max-w-[clamp(9rem,13vw,12.5rem)]')

    const fabric = container.querySelector('[data-banner] .anvl-banner-body')
    expect(fabric).not.toBeNull()
    expect(fabric!.className).toContain('aspect-[3/4.75]')
    expect(fabric!.className).toContain('md:aspect-[3/4.35]')
    expect(fabric!.className).toContain('xl:aspect-[3/4.15]')
  })

  it('feathers top and bottom scene seams at every breakpoint', () => {
    const { container } = render(
      <ProductRevealSequence
        products={[]}
        content={OATH_DEFAULT_CONTENT.products}
      />,
    )
    const section = container.querySelector('[data-scene="products"]')
    expect(section).not.toBeNull()

    const topSeams = section!.querySelectorAll('[data-scene-seam="top"]')
    const bottomSeams = section!.querySelectorAll('[data-scene-seam="bottom"]')
    expect(topSeams).toHaveLength(2)
    expect(bottomSeams).toHaveLength(2)

    const mobileTop = topSeams[0]!
    const desktopTop = topSeams[1]!
    expect(mobileTop.getAttribute('data-scene-seam-tone')).toBe('subtle')
    expect(mobileTop.className).toMatch(/\bxl:hidden\b/)
    expect(desktopTop.getAttribute('data-scene-seam-tone')).toBe('default')
    expect(desktopTop.className).toMatch(/\bhidden\b/)
    expect(desktopTop.className).toMatch(/\bxl:block\b/)

    const mobileBottom = bottomSeams[0]!
    const desktopBottom = bottomSeams[1]!
    expect(mobileBottom.getAttribute('data-scene-seam-tone')).toBe('subtle')
    expect(mobileBottom.className).toMatch(/\bxl:hidden\b/)
    expect(desktopBottom.getAttribute('data-scene-seam-tone')).toBe('blend')
  })

  it('applies xl alpha mask on the section for transparent blend into finale', () => {
    const { container } = render(
      <ProductRevealSequence
        products={[]}
        content={OATH_DEFAULT_CONTENT.products}
      />,
    )
    const section = container.querySelector('[data-scene="products"]')
    expect(section).not.toBeNull()
    expect(section!.className).toMatch(/xl:\[mask-image:linear-gradient\(to_bottom/)
  })

  it('softens the ember wash on xl for transparent blend into finale', () => {
    const { container } = render(
      <ProductRevealSequence
        products={[]}
        content={OATH_DEFAULT_CONTENT.products}
      />,
    )
    const section = container.querySelector('[data-scene="products"]')
    expect(section).not.toBeNull()
    const wash = section!.querySelector('[class*="-bottom-20"]')
    expect(wash).not.toBeNull()
    expect(wash!.className).toMatch(/max-xl:\[mask-image:/)
    expect(wash!.className).toMatch(/xl:\[mask-image:linear-gradient\(to_bottom,black_0%,black_44%,transparent_78%\)/)
    expect(wash!.querySelector('[class*="rounded-[50%]"]')!.className).toMatch(/\bxl:opacity-70\b/)
  })
})

describe('ProductRevealSequence banner stacking', () => {
  function getBanners(container: HTMLElement) {
    return Array.from(container.querySelectorAll<HTMLElement>('[data-banner]'))
  }

  function getDepthLayer(banner: HTMLElement) {
    return banner.querySelector<HTMLElement>('[data-banner-depth]')
  }

  it('keeps the centre banner in front by default on md+ with depth scale on the inner wrapper', () => {
    const { container } = render(
      <ProductRevealSequence
        products={[]}
        content={OATH_DEFAULT_CONTENT.products}
      />,
    )
    const banners = getBanners(container)
    expect(banners).toHaveLength(3)

    const centerDepth = getDepthLayer(banners[1]!)
    const leftDepth = getDepthLayer(banners[0]!)
    const rightDepth = getDepthLayer(banners[2]!)

    expect(banners[1]).toHaveAttribute('data-banner-front', 'true')
    expect(banners[1]!.className).toMatch(/\bz-30\b/)
    expect(centerDepth!.className).toContain('md:scale-[1.08]')
    expect(banners[0]!.className).toMatch(/\bz-10\b/)
    expect(banners[2]!.className).toMatch(/\bz-10\b/)
    expect(leftDepth!.className).toContain('md:scale-[0.92]')
    expect(rightDepth!.className).toContain('md:scale-[0.92]')
  })

  it('elevates a hovered side banner and demotes the centre piece', () => {
    const { container } = render(
      <ProductRevealSequence
        products={[]}
        content={OATH_DEFAULT_CONTENT.products}
      />,
    )
    const banners = getBanners(container)
    const grid = container.querySelector('[data-product-reveal] ul')
    expect(grid).not.toBeNull()

    fireEvent.mouseEnter(banners[0]!)
    expect(banners[0]).toHaveAttribute('data-banner-front', 'true')
    expect(banners[0]!.className).toMatch(/\bz-30\b/)
    expect(getDepthLayer(banners[0]!)!.className).toContain('md:scale-[1.08]')
    expect(banners[1]!.className).toMatch(/\bz-10\b/)
    expect(banners[1]).not.toHaveAttribute('data-banner-front')
    expect(getDepthLayer(banners[1]!)!.className).toContain('md:scale-[0.92]')

    fireEvent.mouseLeave(grid!)
    expect(banners[1]).toHaveAttribute('data-banner-front', 'true')
    expect(banners[1]!.className).toMatch(/\bz-30\b/)
    expect(getDepthLayer(banners[1]!)!.className).toContain('md:scale-[1.08]')
    expect(banners[0]!.className).toMatch(/\bz-10\b/)
    expect(getDepthLayer(banners[0]!)!.className).toContain('md:scale-[0.92]')
  })

  it('restores centre-front when hover moves between side banners', () => {
    const { container } = render(
      <ProductRevealSequence
        products={[]}
        content={OATH_DEFAULT_CONTENT.products}
      />,
    )
    const banners = getBanners(container)

    fireEvent.mouseEnter(banners[2]!)
    expect(banners[2]).toHaveAttribute('data-banner-front', 'true')
    expect(getDepthLayer(banners[2]!)!.className).toContain('md:scale-[1.08]')

    fireEvent.mouseEnter(banners[0]!)
    expect(banners[0]).toHaveAttribute('data-banner-front', 'true')
    expect(banners[2]!.className).toMatch(/\bz-10\b/)
    expect(getDepthLayer(banners[2]!)!.className).toContain('md:scale-[0.92]')
  })
})
