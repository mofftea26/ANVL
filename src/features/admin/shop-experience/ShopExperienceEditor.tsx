import { Check, Info, Save, ShoppingBag } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'
import { toast } from 'sonner'
import { AdminCheckbox } from '@/features/admin/components/AdminCheckbox'
import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { AdminFormField } from '@/features/admin/components/AdminFormField'
import { AdminInput } from '@/features/admin/components/AdminInput'
import { AdminRailPanel } from '@/features/admin/components/AdminRailPanel'
import { AdminTopbarChipButton } from '@/features/admin/components/AdminTopbarChipButton'
import { AdminWorkspace } from '@/features/admin/components/AdminWorkspace'
import { useAdminPageActions } from '@/features/admin/components/AdminPageActionsContext'
import { useSaveSuccessFlash } from '@/features/admin/hooks/useSaveSuccessFlash'
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

function RangeField({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  suffix?: string
  onChange: (n: number) => void
}) {
  return (
    <AdminFormField label={`${label} — ${value}${suffix ?? ''}`}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="focus-ring h-2 w-full cursor-pointer accent-[var(--color-accent)]"
        aria-label={label}
      />
    </AdminFormField>
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
  const { showSuccess, flashSuccess } = useSaveSuccessFlash()
  const stored = useStoredShopConfig()
  const [config, setConfig] = useState<ShopConfig>(stored)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setConfig(stored)
  }, [stored])

  const set = useCallback(
    <K extends keyof ShopConfig>(key: K, value: ShopConfig[K]) =>
      setConfig((prev) => ({ ...prev, [key]: value })),
    [],
  )

  const save = useCallback(() => {
    void (async () => {
      setSaving(true)
      try {
        await saveShopConfigAsync(config)
        toast.success('Shop settings saved.')
        flashSuccess()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not save shop settings.')
      } finally {
        setSaving(false)
      }
    })()
  }, [config, flashSuccess])

  const toolbar = useMemo(
    () => (
      <AdminTopbarChipButton
        type="button"
        disabled={saving}
        icon={showSuccess ? <Check size={14} /> : <Save size={14} />}
        variant="primary"
        loading={saving}
        onClick={save}
      >
        {saving ? 'Saving…' : showSuccess ? 'Saved' : 'Save shop'}
      </AdminTopbarChipButton>
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
      icon={<Info size={15} />}
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
            <AdminCheckbox
              label="Show the shop hero"
              description="The cinematic intro band. Off = a compact heading only."
              checked={config.heroVisible}
              onChange={(e) => set('heroVisible', e.target.checked)}
            />
            <AdminFormField label="Eyebrow">
              <AdminInput value={config.eyebrow} onChange={(e) => set('eyebrow', e.target.value)} />
            </AdminFormField>
            <AdminFormField label="Heading">
              <AdminInput value={config.heading} onChange={(e) => set('heading', e.target.value)} />
            </AdminFormField>
            <AdminFormField label="Intro paragraph">
              <Textarea rows={2} value={config.intro} onChange={(e) => set('intro', e.target.value)} />
            </AdminFormField>
            <AdminFormField label="Editorial line" hint="Small secondary line under the heading.">
              <AdminInput value={config.editorialCopy} onChange={(e) => set('editorialCopy', e.target.value)} />
            </AdminFormField>
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
            <RangeField label="Grid gap" value={config.gridGap} min={8} max={40} step={2} suffix="px" onChange={(n) => set('gridGap', n)} />
            <RangeField label="Section spacing" value={config.sectionSpacing} min={24} max={120} step={4} suffix="px" onChange={(n) => set('sectionSpacing', n)} />
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
            <RangeField label="Card radius" value={config.cardRadius} min={0} max={32} step={1} suffix="px" onChange={(n) => set('cardRadius', n)} />
            <RangeField
              label="Animation speed ×"
              value={config.animationDurationMultiplier}
              min={0.5}
              max={2}
              step={0.1}
              onChange={(n) => set('animationDurationMultiplier', n)}
            />
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <AdminCheckbox
              label="Advanced desktop effects"
              checked={config.advancedDesktopEffects}
              onChange={(e) => set('advancedDesktopEffects', e.target.checked)}
            />
            <AdminCheckbox
              label="Reduced effects on mobile"
              checked={config.reducedEffectsMobile}
              onChange={(e) => set('reducedEffectsMobile', e.target.checked)}
            />
          </div>
        </Section>

        <Section title="What cards show">
          <div className="grid gap-2 sm:grid-cols-2">
            <AdminCheckbox label="Quick add" checked={config.quickAddEnabled} onChange={(e) => set('quickAddEnabled', e.target.checked)} />
            <AdminCheckbox label="Quick view" checked={config.quickViewEnabled} onChange={(e) => set('quickViewEnabled', e.target.checked)} />
            <AdminCheckbox label="Prices" checked={config.showPrices} onChange={(e) => set('showPrices', e.target.checked)} />
            <AdminCheckbox label="Compare-at prices" checked={config.showComparePrices} onChange={(e) => set('showComparePrices', e.target.checked)} />
            <AdminCheckbox label="Badges" checked={config.showBadges} onChange={(e) => set('showBadges', e.target.checked)} />
            <AdminCheckbox label="Color swatches" checked={config.showSwatches} onChange={(e) => set('showSwatches', e.target.checked)} />
            <AdminCheckbox label="Available sizes" checked={config.showSizes} onChange={(e) => set('showSizes', e.target.checked)} />
            <AdminCheckbox label="Inventory urgency" description="Only shows with real low-stock data." checked={config.showInventoryUrgency} onChange={(e) => set('showInventoryUrgency', e.target.checked)} />
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
              <AdminCheckbox
                key={v}
                label={SORT_LABELS[v]}
                checked={config.enabledSortOptions.includes(v)}
                onChange={() => toggleSort(v)}
              />
            ))}
          </div>
        </Section>

        <Section title="Filters">
          <AdminCheckbox
            label="Sticky filter rail"
            description="Keeps the desktop filter rail pinned while scrolling."
            checked={config.stickyFilters}
            onChange={(e) => set('stickyFilters', e.target.checked)}
          />
          <p className="anvl-micro mb-2 mt-4 text-[var(--color-text-muted)]">Visible filters</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {SHOP_FILTER_KEYS.map((key) => (
              <AdminCheckbox
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
            <AdminCheckbox
              label="Show editorial banner above the grid"
              checked={config.editorialBanner.visible}
              onChange={(e) => set('editorialBanner', { ...config.editorialBanner, visible: e.target.checked })}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminFormField label="Banner title">
                <AdminInput
                  value={config.editorialBanner.title}
                  onChange={(e) => set('editorialBanner', { ...config.editorialBanner, title: e.target.value })}
                />
              </AdminFormField>
              <AdminFormField label="Banner body">
                <AdminInput
                  value={config.editorialBanner.body}
                  onChange={(e) => set('editorialBanner', { ...config.editorialBanner, body: e.target.value })}
                />
              </AdminFormField>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminFormField label="Empty catalog — title">
                <AdminInput value={config.emptyState.title} onChange={(e) => set('emptyState', { ...config.emptyState, title: e.target.value })} />
              </AdminFormField>
              <AdminFormField label="Empty catalog — body">
                <AdminInput value={config.emptyState.body} onChange={(e) => set('emptyState', { ...config.emptyState, body: e.target.value })} />
              </AdminFormField>
              <AdminFormField label="No results — title">
                <AdminInput value={config.noResults.title} onChange={(e) => set('noResults', { ...config.noResults, title: e.target.value })} />
              </AdminFormField>
              <AdminFormField label="No results — body">
                <AdminInput value={config.noResults.body} onChange={(e) => set('noResults', { ...config.noResults, body: e.target.value })} />
              </AdminFormField>
            </div>
          </div>
        </Section>

        <Section title="Product detail page">
          <p className="anvl-micro mb-3 text-[var(--color-text-muted)]">Sections</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <AdminCheckbox label="Materials showcase" checked={config.pdp.showMaterials} onChange={(e) => set('pdp', { ...config.pdp, showMaterials: e.target.checked })} />
            <AdminCheckbox label="Colorways showcase" checked={config.pdp.showColorways} onChange={(e) => set('pdp', { ...config.pdp, showColorways: e.target.checked })} />
            <AdminCheckbox label="Design details" checked={config.pdp.showDesignDetails} onChange={(e) => set('pdp', { ...config.pdp, showDesignDetails: e.target.checked })} />
            <AdminCheckbox label="Story" checked={config.pdp.showStory} onChange={(e) => set('pdp', { ...config.pdp, showStory: e.target.checked })} />
            <AdminCheckbox label="Size guide" checked={config.pdp.showSizeGuide} onChange={(e) => set('pdp', { ...config.pdp, showSizeGuide: e.target.checked })} />
            <AdminCheckbox label="Related products" checked={config.pdp.showRelated} onChange={(e) => set('pdp', { ...config.pdp, showRelated: e.target.checked })} />
            <AdminCheckbox label="Share button" checked={config.pdp.showShare} onChange={(e) => set('pdp', { ...config.pdp, showShare: e.target.checked })} />
            <AdminCheckbox label="Sticky buy panel (desktop)" checked={config.pdp.stickyBuyPanel} onChange={(e) => set('pdp', { ...config.pdp, stickyBuyPanel: e.target.checked })} />
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
          <ShoppingBag size={13} aria-hidden="true" />
          Changes preview live on /shop in this browser; Save publishes to all visitors.
        </p>
      </div>
    </AdminWorkspace>
  )
}
