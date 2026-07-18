import { Check, Info, Save, ShoppingBag } from '@/shared/icons'
import {
  useCallback,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from 'react'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { AdminRailPanel } from '@/features/admin/components/AdminRailPanel'
import { AdminRangeField } from '@/features/admin/components/AdminRangeField'
import { AdminWorkspace } from '@/features/admin/components/AdminWorkspace'
import { useAdminPageActions } from '@/features/admin/components/AdminPageActionsContext'
import { useSingletonCmsEditor } from '@/features/admin/hooks/useSingletonCmsEditor'
import { usePushPreviewDraft } from '@/features/admin/preview/usePushPreviewDraft'
import {
  readShopConfigFromStorage,
  saveShopConfigAsync,
  subscribeShopConfigChange,
} from '@/features/cms/shop/shopExperience.settings'
import {
  SHOP_FILTER_KEYS,
  SHOP_SORT_VALUES,
  type ShopConfig,
  type ShopFilterKey,
  type ShopSortValue,
} from '@/features/cms/shop/shopExperience.zod'
import { Textarea } from '@/shared/components/ui'
import { Button } from '@/shared/components/ui/Button'
import { Checkbox } from '@/shared/components/ui/Checkbox'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'

const SORT_LABELS: Record<ShopSortValue, string> = {
  featured: 'Featured',
  newest: 'Newest',
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
  'name-asc': 'Name: A–Z',
  availability: 'Availability',
}

const FILTER_LABELS: Record<ShopFilterKey, string> = {
  status: 'Status',
  category: 'Category',
  drop: 'Drop',
  source: 'Listing source',
  color: 'Colorway',
  size: 'Size',
  price: 'Price',
}

function useStoredShopConfig(): ShopConfig {
  return useSyncExternalStore(
    subscribeShopConfigChange,
    () => readShopConfigFromStorage(),
    () => readShopConfigFromStorage(),
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--color-line)] p-5">
      <h2 className="anvl-heading mb-4 text-base font-normal">{title}</h2>
      {children}
    </section>
  )
}

/**
 * Shop Experience editor — controls /shop layout, behavior, and copy. Writes a
 * local working copy and pushes to Supabase (`cms_settings.shop_config` +
 * `storefront_publication.shop_config`) on save. No colors here: the shop
 * inherits the active theme via the derived `--shop-*` tokens.
 */
export function ShopExperienceEditor() {
  const setPageActions = useAdminPageActions()
  const stored = useStoredShopConfig()
  const { config, setConfig, saving, showSuccess, save } = useSingletonCmsEditor({
    id: 'shop',
    stored,
    saveAsync: saveShopConfigAsync,
    successMessage: 'Shop settings saved.',
    errorFallbackMessage: 'Could not save shop settings.',
  })
  usePushPreviewDraft('shopConfig', config)

  const set = useCallback(
    <K extends keyof ShopConfig>(key: K, value: ShopConfig[K]) =>
      setConfig((prev) => ({ ...prev, [key]: value })),
    [setConfig],
  )

  const toolbar = useMemo(
    () => (
      <Button
        type="button"
        disabled={saving}
        variant="primary"
        size="md"
        density="compact"
        loading={saving}
        onClick={save}
      >
        {showSuccess ? <Check size={ICON_SIZE.sm} /> : <Save size={ICON_SIZE.sm} />}
        {saving ? 'Saving…' : showSuccess ? 'Saved' : 'Save shop'}
      </Button>
    ),
    [save, saving, showSuccess],
  )

  useEffect(() => {
    setPageActions(toolbar)
    return () => setPageActions(null)
  }, [toolbar, setPageActions])

  const toggleSort = (value: ShopSortValue) => {
    const set_ = new Set(config.enabledSortOptions)
    if (set_.has(value)) set_.delete(value)
    else set_.add(value)
    set('enabledSortOptions', SHOP_SORT_VALUES.filter((v) => set_.has(v)))
  }

  const rail = (
    <AdminRailPanel
      title="How shop settings apply"
      icon={<Info size={17} />}
      description="Saved to Supabase and read by the storefront /shop page."
    >
      <ul className="space-y-2 text-xs text-[var(--color-text-muted)]">
        <li>Colors come from the active theme — edit those in Theme &amp; Colors.</li>
        <li>The product-card material image is set under Assets → Shop.</li>
        <li>Toggles hide/show parts of every card; layout controls density &amp; columns.</li>
      </ul>
    </AdminRailPanel>
  )

  return (
    <AdminWorkspace asideLabel="Shop settings help" aside={rail}>
      <div className="space-y-6" data-testid="shop-experience-editor">
        <Section title="Introduction">
          <div className="space-y-4">
            <Checkbox
              label="Show the shop hero"
              description="The cinematic intro band. Off = a compact heading only."
              checked={config.heroVisible}
              onChange={(e) => set('heroVisible', e.target.checked)}
            />
            <FormField label="Eyebrow" labelStyle="stacked">
              <Input density="compact" value={config.eyebrow} onChange={(e) => set('eyebrow', e.target.value)} />
            </FormField>
            <FormField label="Heading" labelStyle="stacked">
              <Input density="compact" value={config.heading} onChange={(e) => set('heading', e.target.value)} />
            </FormField>
            <FormField label="Intro paragraph" labelStyle="stacked">
              <Textarea rows={2} value={config.intro} onChange={(e) => set('intro', e.target.value)} />
            </FormField>
            <FormField label="Editorial line" hint="Small secondary line under the heading." labelStyle="stacked">
              <Input density="compact" value={config.editorialCopy} onChange={(e) => set('editorialCopy', e.target.value)} />
            </FormField>
          </div>
        </Section>

        <Section title="Grid & layout">
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminFieldSelect
              label="Grid density"
              value={config.gridDensity}
              onChange={(v) => set('gridDensity', v as ShopConfig['gridDensity'])}
              options={[
                { value: 'comfortable', label: 'Comfortable' },
                { value: 'compact', label: 'Compact' },
                { value: 'spacious', label: 'Spacious' },
              ]}
            />
            <AdminFieldSelect
              label="Desktop columns"
              value={String(config.desktopColumns)}
              onChange={(v) => set('desktopColumns', Number(v) === 4 ? 4 : 3)}
              options={[
                { value: '3', label: '3 columns' },
                { value: '4', label: '4 columns' },
              ]}
            />
            <AdminRangeField label="Grid gap" value={config.gridGap} min={8} max={40} step={2} suffix="px" onChange={(n) => set('gridGap', n)} />
            <AdminRangeField label="Section spacing" value={config.sectionSpacing} min={24} max={120} step={4} suffix="px" onChange={(n) => set('sectionSpacing', n)} />
          </div>
        </Section>

        <Section title="Product cards">
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminFieldSelect
              label="Card style"
              value={config.cardStyle}
              onChange={(v) => set('cardStyle', v as ShopConfig['cardStyle'])}
              options={[
                { value: 'forged', label: 'Forged plate', description: 'Tactile steel-plate card (default)' },
                { value: 'banner', label: 'War banner', description: 'Heraldic gonfalon card' },
              ]}
            />
            <AdminFieldSelect
              label="Card aspect"
              value={config.cardAspectRatio}
              onChange={(v) => set('cardAspectRatio', v as ShopConfig['cardAspectRatio'])}
              options={[
                { value: 'portrait', label: 'Portrait (3:4)' },
                { value: 'square', label: 'Square (1:1)' },
                { value: 'tall', label: 'Tall (4:5)' },
              ]}
            />
            <AdminFieldSelect
              label="Image fit"
              value={config.imageFit}
              onChange={(v) => set('imageFit', v as ShopConfig['imageFit'])}
              options={[
                { value: 'cover', label: 'Cover (fill)' },
                { value: 'contain', label: 'Contain (fit)' },
              ]}
            />
            <AdminFieldSelect
              label="Card animation"
              value={config.cardAnimationIntensity}
              onChange={(v) => set('cardAnimationIntensity', v as ShopConfig['cardAnimationIntensity'])}
              options={[
                { value: 'full', label: 'Full' },
                { value: 'subtle', label: 'Subtle' },
                { value: 'off', label: 'Off' },
              ]}
            />
            <AdminRangeField label="Card radius" value={config.cardRadius} min={0} max={32} step={1} suffix="px" onChange={(n) => set('cardRadius', n)} />
            <AdminRangeField
              label="Animation speed ×"
              value={config.animationDurationMultiplier}
              min={0.5}
              max={2}
              step={0.1}
              onChange={(n) => set('animationDurationMultiplier', n)}
            />
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Checkbox
              label="Advanced desktop effects"
              checked={config.advancedDesktopEffects}
              onChange={(e) => set('advancedDesktopEffects', e.target.checked)}
            />
            <Checkbox
              label="Reduced effects on mobile"
              checked={config.reducedEffectsMobile}
              onChange={(e) => set('reducedEffectsMobile', e.target.checked)}
            />
          </div>
        </Section>

        <Section title="What cards show">
          <div className="grid gap-2 sm:grid-cols-2">
            <Checkbox label="Quick add" checked={config.quickAddEnabled} onChange={(e) => set('quickAddEnabled', e.target.checked)} />
            <Checkbox label="Quick view" checked={config.quickViewEnabled} onChange={(e) => set('quickViewEnabled', e.target.checked)} />
            <Checkbox label="Prices" checked={config.showPrices} onChange={(e) => set('showPrices', e.target.checked)} />
            <Checkbox label="Compare-at prices" checked={config.showComparePrices} onChange={(e) => set('showComparePrices', e.target.checked)} />
            <Checkbox label="Badges" checked={config.showBadges} onChange={(e) => set('showBadges', e.target.checked)} />
            <Checkbox label="Color swatches" checked={config.showSwatches} onChange={(e) => set('showSwatches', e.target.checked)} />
            <Checkbox label="Available sizes" checked={config.showSizes} onChange={(e) => set('showSizes', e.target.checked)} />
            <Checkbox label="Inventory urgency" description="Only shows with real low-stock data." checked={config.showInventoryUrgency} onChange={(e) => set('showInventoryUrgency', e.target.checked)} />
          </div>
        </Section>

        <Section title="Sorting">
          <AdminFieldSelect
            label="Default sort"
            value={config.defaultSort}
            onChange={(v) => set('defaultSort', v as ShopSortValue)}
            options={SHOP_SORT_VALUES.map((v) => ({ value: v, label: SORT_LABELS[v] }))}
          />
          <p className="anvl-micro mb-2 mt-4 text-[var(--color-text-muted)]">Available sort options</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {SHOP_SORT_VALUES.map((v) => (
              <Checkbox
                key={v}
                label={SORT_LABELS[v]}
                checked={config.enabledSortOptions.includes(v)}
                onChange={() => toggleSort(v)}
              />
            ))}
          </div>
        </Section>

        <Section title="Filters">
          <Checkbox
            label="Sticky filter rail"
            description="Keeps the desktop filter rail pinned while scrolling."
            checked={config.stickyFilters}
            onChange={(e) => set('stickyFilters', e.target.checked)}
          />
          <p className="anvl-micro mb-2 mt-4 text-[var(--color-text-muted)]">Visible filters</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {SHOP_FILTER_KEYS.map((key) => (
              <Checkbox
                key={key}
                label={FILTER_LABELS[key]}
                checked={config.filterVisibility[key] !== false}
                onChange={(e) =>
                  set('filterVisibility', { ...config.filterVisibility, [key]: e.target.checked })
                }
              />
            ))}
          </div>
        </Section>

        <Section title="State copy">
          <div className="space-y-4">
            <Checkbox
              label="Show editorial banner above the grid"
              checked={config.editorialBanner.visible}
              onChange={(e) => set('editorialBanner', { ...config.editorialBanner, visible: e.target.checked })}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Banner title" labelStyle="stacked">
                <Input density="compact"
                  value={config.editorialBanner.title}
                  onChange={(e) => set('editorialBanner', { ...config.editorialBanner, title: e.target.value })}
                />
              </FormField>
              <FormField label="Banner body" labelStyle="stacked">
                <Input density="compact"
                  value={config.editorialBanner.body}
                  onChange={(e) => set('editorialBanner', { ...config.editorialBanner, body: e.target.value })}
                />
              </FormField>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Empty catalog — title" labelStyle="stacked">
                <Input density="compact" value={config.emptyState.title} onChange={(e) => set('emptyState', { ...config.emptyState, title: e.target.value })} />
              </FormField>
              <FormField label="Empty catalog — body" labelStyle="stacked">
                <Input density="compact" value={config.emptyState.body} onChange={(e) => set('emptyState', { ...config.emptyState, body: e.target.value })} />
              </FormField>
              <FormField label="No results — title" labelStyle="stacked">
                <Input density="compact" value={config.noResults.title} onChange={(e) => set('noResults', { ...config.noResults, title: e.target.value })} />
              </FormField>
              <FormField label="No results — body" labelStyle="stacked">
                <Input density="compact" value={config.noResults.body} onChange={(e) => set('noResults', { ...config.noResults, body: e.target.value })} />
              </FormField>
            </div>
          </div>
        </Section>

        <Section title="Product detail page">
          <p className="anvl-micro mb-3 text-[var(--color-text-muted)]">Sections</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Checkbox label="Materials showcase" checked={config.pdp.showMaterials} onChange={(e) => set('pdp', { ...config.pdp, showMaterials: e.target.checked })} />
            <Checkbox label="Colorways showcase" checked={config.pdp.showColorways} onChange={(e) => set('pdp', { ...config.pdp, showColorways: e.target.checked })} />
            <Checkbox label="Design details" checked={config.pdp.showDesignDetails} onChange={(e) => set('pdp', { ...config.pdp, showDesignDetails: e.target.checked })} />
            <Checkbox label="Story" checked={config.pdp.showStory} onChange={(e) => set('pdp', { ...config.pdp, showStory: e.target.checked })} />
            <Checkbox label="Size guide" checked={config.pdp.showSizeGuide} onChange={(e) => set('pdp', { ...config.pdp, showSizeGuide: e.target.checked })} />
            <Checkbox label="Related products" checked={config.pdp.showRelated} onChange={(e) => set('pdp', { ...config.pdp, showRelated: e.target.checked })} />
            <Checkbox label="Share button" checked={config.pdp.showShare} onChange={(e) => set('pdp', { ...config.pdp, showShare: e.target.checked })} />
            <Checkbox label="Sticky buy panel (desktop)" checked={config.pdp.stickyBuyPanel} onChange={(e) => set('pdp', { ...config.pdp, stickyBuyPanel: e.target.checked })} />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <AdminFieldSelect
              label="Related products count"
              value={String(config.pdp.relatedCount)}
              onChange={(v) => set('pdp', { ...config.pdp, relatedCount: (Number(v) === 6 ? 6 : Number(v) === 3 ? 3 : 4) })}
              options={[
                { value: '3', label: '3' },
                { value: '4', label: '4' },
                { value: '6', label: '6' },
              ]}
            />
            <AdminFieldSelect
              label="PDP animation"
              value={config.pdp.animationIntensity}
              onChange={(v) => set('pdp', { ...config.pdp, animationIntensity: v as ShopConfig['pdp']['animationIntensity'] })}
              options={[
                { value: 'full', label: 'Full' },
                { value: 'subtle', label: 'Subtle' },
                { value: 'off', label: 'Off' },
              ]}
            />
          </div>
        </Section>

        <p className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <ShoppingBag size={15} aria-hidden="true" />
          Changes preview live on /shop in this browser; Save publishes to all visitors.
        </p>
      </div>
    </AdminWorkspace>
  )
}
