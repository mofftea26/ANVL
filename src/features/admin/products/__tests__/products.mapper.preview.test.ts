import { describe, expect, it } from 'vitest'
import { adminProductPrimaryPreviewImage } from '@/features/admin/products/products.mapper'
import type { AdminProduct } from '@/features/admin/products/products.types'

describe('adminProductPrimaryPreviewImage', () => {
  it('returns primary sorted image metadata', () => {
    const p = {
      name: 'Omega Tee',
      colors: [
        {
          id: 'c1',
          name: 'Black',
          hex: '#000',
          images: [
            {
              id: 'i2',
              url: '/b.svg',
              alt: '',
              isPrimary: false,
              sortOrder: 1,
            },
            {
              id: 'i1',
              url: '/a.svg',
              alt: 'Custom alt',
              isPrimary: true,
              sortOrder: 0,
            },
          ],
        },
      ],
    } as unknown as AdminProduct
    expect(adminProductPrimaryPreviewImage(p)).toEqual({
      src: '/a.svg',
      alt: 'Custom alt',
    })
  })

  it('returns null when no usable URL', () => {
    const p = {
      name: 'X',
      colors: [{ id: 'c1', name: 'Black', hex: '#000', images: [] }],
    } as unknown as AdminProduct
    expect(adminProductPrimaryPreviewImage(p)).toBeNull()
  })
})
