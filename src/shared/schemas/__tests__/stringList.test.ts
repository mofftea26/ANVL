import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { splitLegacyLines, tolerantStringList } from '@/shared/schemas/stringList'
import { aboutLandingContentSchema } from '@/features/about/content/aboutContent.schema'
import { oathLandingContentSchema } from '@/features/landingPages/pages/TheOathLanding/content/oathContent.schema'

describe('splitLegacyLines', () => {
  it('splits on newlines, trims, and drops blank lines', () => {
    expect(splitLegacyLines('One\n  Two  \n\n Three')).toEqual(['One', 'Two', 'Three'])
  })
})

describe('tolerantStringList', () => {
  const schema = z.object({ lines: tolerantStringList(3) })

  it('passes an array through unchanged', () => {
    expect(schema.parse({ lines: ['a', 'b'] }).lines).toEqual(['a', 'b'])
  })

  it('coerces a legacy \\n-joined string into an array', () => {
    expect(schema.parse({ lines: 'a\nb\nc' }).lines).toEqual(['a', 'b', 'c'])
  })

  it('allows the field to be absent', () => {
    expect(schema.parse({}).lines).toBeUndefined()
  })

  it('enforces the max on arrays', () => {
    expect(() => schema.parse({ lines: ['a', 'b', 'c', 'd'] })).toThrow()
  })
})

describe('About orb lines — tolerant migration', () => {
  it('parses a legacy \\n-joined orb lines string into an array', () => {
    const parsed = aboutLandingContentSchema.parse({
      orbs: [{ lines: 'Forged.\nTested.\nProven.' }],
    })
    expect(parsed.orbs?.[0]?.lines).toEqual(['Forged.', 'Tested.', 'Proven.'])
  })

  it('round-trips an array of orb lines', () => {
    const input = { orbs: [{ lines: ['Forged.', 'Tested.'] }] }
    const parsed = aboutLandingContentSchema.parse(input)
    expect(parsed.orbs?.[0]?.lines).toEqual(['Forged.', 'Tested.'])
  })
})

describe('Oath manifesto lines — tolerant migration', () => {
  it('parses a legacy \\n-joined manifesto string into an array', () => {
    const parsed = oathLandingContentSchema.parse({
      manifesto: { lines: 'I will not break.\nI will not bend.' },
    })
    expect(parsed.manifesto?.lines).toEqual(['I will not break.', 'I will not bend.'])
  })

  it('round-trips an array of manifesto lines', () => {
    const input = { manifesto: { lines: ['One.', 'Two.'] } }
    const parsed = oathLandingContentSchema.parse(input)
    expect(parsed.manifesto?.lines).toEqual(['One.', 'Two.'])
  })
})
