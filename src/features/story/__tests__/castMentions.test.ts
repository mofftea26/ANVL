import { describe, expect, it } from 'vitest'
import {
  castMentionHref,
  splitCastMentions,
} from '@/features/story/lib/castMentions'
import {
  storyCastMemberSchema,
  type StoryCastMember,
} from '@/features/story/schemas/story.schema'

function member(over: Partial<StoryCastMember>): StoryCastMember {
  return storyCastMemberSchema.parse({ id: 'x', name: 'X', ...over })
}

describe('splitCastMentions', () => {
  it('returns a single text segment when no cast matches', () => {
    const segs = splitCastMentions('Nobody here.', [member({ name: 'Jad' })])
    expect(segs).toEqual([{ type: 'text', text: 'Nobody here.' }])
  })

  it('lights up a cast name at a word boundary', () => {
    const jad = member({ id: 'c1', name: 'Jad' })
    const segs = splitCastMentions('When Jad struck, the bar bent.', [jad])
    expect(segs).toHaveLength(3)
    expect(segs[0]).toEqual({ type: 'text', text: 'When ' })
    expect(segs[1]).toMatchObject({ type: 'mention', text: 'Jad' })
    expect((segs[1] as { member: StoryCastMember }).member.id).toBe('c1')
    expect(segs[2]).toEqual({ type: 'text', text: ' struck, the bar bent.' })
  })

  it('never matches inside a word', () => {
    const jad = member({ name: 'Jad' })
    const segs = splitCastMentions('Jaded soldiers rest.', [jad])
    expect(segs).toEqual([{ type: 'text', text: 'Jaded soldiers rest.' }])
  })

  it('prefers the longest name when two overlap', () => {
    const short = member({ id: 'short', name: 'Jad' })
    const long = member({ id: 'long', name: 'Jad Haddad' })
    const segs = splitCastMentions('Jad Haddad leads.', [short, long])
    const mention = segs.find((s) => s.type === 'mention')
    expect(mention).toMatchObject({ text: 'Jad Haddad' })
    expect((mention as { member: StoryCastMember }).member.id).toBe('long')
  })

  it('matches case-insensitively but preserves source casing', () => {
    const segs = splitCastMentions('the GENERAL spoke.', [member({ name: 'General' })])
    expect(segs.find((s) => s.type === 'mention')).toMatchObject({ text: 'GENERAL' })
  })
})

describe('castMentionHref', () => {
  it('links only when a public armory handle exists', () => {
    expect(castMentionHref(member({ armoryHandle: 'abc12345' }))).toBe('/armory/abc12345')
    expect(castMentionHref(member({ armoryHandle: null }))).toBeNull()
  })
})
