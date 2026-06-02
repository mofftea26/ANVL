import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { HeroBackgroundMedia } from '@/features/marketing/components/HeroBackgroundMedia'

describe('HeroBackgroundMedia', () => {
  it('renders poster and video when both URLs are safe', () => {
    render(
      <HeroBackgroundMedia
        videoUrl="https://cdn.example.com/loop.mp4"
        posterUrl="https://cdn.example.com/poster.jpg"
      />,
    )
    expect(document.querySelector('video')).toBeTruthy()
    expect(document.querySelector('img')).toBeTruthy()
  })

  it('renders poster only when video URL is unsafe', () => {
    render(
      <HeroBackgroundMedia
        videoUrl="javascript:alert(1)"
        posterUrl="https://cdn.example.com/poster.jpg"
      />,
    )
    expect(document.querySelector('video')).toBeNull()
    expect(document.querySelector('img')).toBeTruthy()
  })

  it('hides video on small viewports unless playVideoOnMobile is set', () => {
    render(
      <HeroBackgroundMedia
        videoUrl="https://cdn.example.com/loop.mp4"
        posterUrl="https://cdn.example.com/poster.jpg"
        playVideoOnMobile={false}
      />,
    )
    const video = document.querySelector('video')
    expect(video?.className).toContain('hidden')
    expect(video?.className).toContain('md:block')
  })
})
