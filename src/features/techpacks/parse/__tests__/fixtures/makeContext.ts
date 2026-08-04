import type { TechpackParseContext } from '../../parserContext'
import type { TechpackIssue } from '../../../schema/techpack.zod'

/**
 * A parse context that records issues instead of writing them anywhere.
 *
 * Tests assert on the issue list as much as on the parsed values — a parser
 * that quietly returns wrong data is worse than one that says it struggled,
 * so "did it raise the right issue?" is a first-class assertion here.
 */
export function makeContext(overrides: Partial<TechpackParseContext> = {}): {
  ctx: TechpackParseContext
  issues: TechpackIssue[]
} {
  const issues: TechpackIssue[] = []

  const ctx: TechpackParseContext = {
    header: {
      product: 'MENS OVERSIZED TEE',
      contrast: 'SOLID (NONE)',
      style: 'ANVL-M-SS01-FW26',
      colorwayCount: 3,
      fabric: {
        raw: '100% COTTON | 260 GSM | SINGLE JERSEY WEFT KNIT TEXTILE CONSTRUCTION',
        composition: [{ material: 'COTTON', percentage: 100 }],
        gsm: 260,
        construction: 'SINGLE JERSEY WEFT KNIT TEXTILE CONSTRUCTION',
      },
      client: 'ANVL ATHLETICS',
    },
    addIssue: (input) => {
      issues.push({
        page: input.page ?? 0,
        path: input.path,
        code: input.code,
        message: input.message,
        severity: input.severity ?? 'warn',
      })
    },
    // Mirrors `buildDocument`'s scheme so ids in tests match production ids.
    imageId: (page, objectKey) => (objectKey ? `p${page}-i0` : ''),
    ...overrides,
  }

  return { ctx, issues }
}
