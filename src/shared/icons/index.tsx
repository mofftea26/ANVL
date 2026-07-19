/**
 * ICON ABSTRACTION LAYER — the single seam between the app and its icon pack.
 *
 * Currently backed by **@phosphor-icons/react** (global weight set via
 * `PHOSPHOR_ICON_WEIGHT` + the IconContext mounted in AppProviders). Every
 * component imports icons from `@/shared/icons` using the historical
 * lucide-react names, mapped below to their Phosphor equivalents.
 *
 * VERDICT (2026-07-17): Phosphor is FINAL — lucide-react removed. This file
 * remains the single seam: any future pack swap happens here alone, with no
 * call-site changes anywhere.
 *
 * WEIGHT POLICY (2026-07-19): duotone is the site-wide default for
 * decorative/pictorial icons, but small FUNCTIONAL glyphs read wrong in
 * duotone. Those are pinned at the seam via `withWeight` (zero call-site
 * changes):
 *   - 'bold'    → checkmarks, plus/minus, close, chevrons, arrows, menu
 *   - 'regular' → utility verbs (search, copy, trash, edit, refresh, upload,
 *                 download, filters, eye toggles, zoom) and the spinner
 * Everything not wrapped inherits 'duotone' from the IconContext.
 */

import { forwardRef } from 'react'
import type { Icon, IconProps, IconWeight } from '@phosphor-icons/react'
import {
  ArrowCounterClockwise as PhArrowCounterClockwise,
  ArrowLeft as PhArrowLeft,
  ArrowRight as PhArrowRight,
  ArrowSquareOut as PhArrowSquareOut,
  ArrowUpRight as PhArrowUpRight,
  ArrowsClockwise as PhArrowsClockwise,
  ArrowsDownUp as PhArrowsDownUp,
  ArrowsLeftRight as PhArrowsLeftRight,
  CaretDown as PhCaretDown,
  CaretLeft as PhCaretLeft,
  CaretRight as PhCaretRight,
  CaretUp as PhCaretUp,
  Check as PhCheck,
  CircleNotch as PhCircleNotch,
  Copy as PhCopy,
  DownloadSimple as PhDownloadSimple,
  Eye as PhEye,
  EyeSlash as PhEyeSlash,
  List as PhList,
  MagnifyingGlass as PhMagnifyingGlass,
  MagnifyingGlassMinus as PhMagnifyingGlassMinus,
  MagnifyingGlassPlus as PhMagnifyingGlassPlus,
  Minus as PhMinus,
  PencilSimple as PhPencilSimple,
  Plus as PhPlus,
  SlidersHorizontal as PhSlidersHorizontal,
  Trash as PhTrash,
  UploadSimple as PhUploadSimple,
  X as PhX,
} from '@phosphor-icons/react'

/** Site-wide Phosphor weight — flip to 'regular' | 'bold' | 'fill' to taste. */
export const PHOSPHOR_ICON_WEIGHT = 'duotone' as const

/**
 * Pins an icon to a fixed weight regardless of the global IconContext.
 * An explicit `weight` prop at a call site still wins; only the context
 * default is overridden. Prop types (incl. `size`/`className`) are unchanged.
 */
function withWeight(BaseIcon: Icon, weight: IconWeight): Icon {
  const Weighted = forwardRef<SVGSVGElement, IconProps>(
    ({ weight: weightProp, ...props }, ref) => (
      <BaseIcon ref={ref} weight={weightProp ?? weight} {...props} />
    ),
  )
  Weighted.displayName = BaseIcon.displayName ?? 'WeightedIcon'
  return Weighted
}

/* ------------------------------------------------------------------------- *
 * Functional glyphs — fixed weight (never duotone).
 * ------------------------------------------------------------------------- */

// 'bold' — small assertive glyphs: checks, plus/minus, close, chevrons,
// arrows, menu burger.
export const ArrowDownUp = withWeight(PhArrowsDownUp, 'bold')
export const ArrowLeft = withWeight(PhArrowLeft, 'bold')
export const ArrowLeftRight = withWeight(PhArrowsLeftRight, 'bold')
export const ArrowRight = withWeight(PhArrowRight, 'bold')
export const ArrowUpRight = withWeight(PhArrowUpRight, 'bold')
export const Check = withWeight(PhCheck, 'bold')
export const ChevronDown = withWeight(PhCaretDown, 'bold')
export const ChevronLeft = withWeight(PhCaretLeft, 'bold')
export const ChevronRight = withWeight(PhCaretRight, 'bold')
export const ChevronUp = withWeight(PhCaretUp, 'bold')
export const Menu = withWeight(PhList, 'bold')
export const Minus = withWeight(PhMinus, 'bold')
export const Plus = withWeight(PhPlus, 'bold')
export const X = withWeight(PhX, 'bold')

// 'regular' — utility verbs + the spinner (a spinner reads cleaner thin).
export const Copy = withWeight(PhCopy, 'regular')
export const Download = withWeight(PhDownloadSimple, 'regular')
export const ExternalLink = withWeight(PhArrowSquareOut, 'regular')
export const Eye = withWeight(PhEye, 'regular')
export const EyeOff = withWeight(PhEyeSlash, 'regular')
export const Loader2 = withWeight(PhCircleNotch, 'regular')
export const Pencil = withWeight(PhPencilSimple, 'regular')
export const RefreshCw = withWeight(PhArrowsClockwise, 'regular')
export const RotateCcw = withWeight(PhArrowCounterClockwise, 'regular')
export const Search = withWeight(PhMagnifyingGlass, 'regular')
export const SlidersHorizontal = withWeight(PhSlidersHorizontal, 'regular')
export const Trash2 = withWeight(PhTrash, 'regular')
export const Upload = withWeight(PhUploadSimple, 'regular')
export const ZoomIn = withWeight(PhMagnifyingGlassPlus, 'regular')
export const ZoomOut = withWeight(PhMagnifyingGlassMinus, 'regular')

/* ------------------------------------------------------------------------- *
 * Decorative / pictorial icons — inherit the global 'duotone' context.
 * ------------------------------------------------------------------------- */

export {
  // a
  Warning as AlertTriangle,
  MedalMilitary as Award,
  // b
  SealCheck as BadgeCheck,
  Bell,
  BookOpen,
  BookOpenText,
  Cube as Box,
  // c
  Calendar,
  CalendarDots as CalendarDays,
  Circle,
  Crosshair,
  Crown,
  // d
  Database,
  // e
  ArrowsOutSimple as Expand,
  // f
  FacebookLogo as Facebook,
  FileText,
  FileArrowUp as FileUp,
  Fingerprint,
  Flame,
  // g–h
  Globe,
  HardDrive,
  Heart,
  Hourglass,
  // i
  Image,
  CameraPlus as ImagePlus,
  Images,
  Tray as Inbox,
  Info,
  InstagramLogo as Instagram,
  // k–l
  Key as KeyRound,
  SquaresFour as LayoutDashboard,
  ListNumbers as ListOrdered,
  Lock,
  SignOut as LogOut,
  // m
  EnvelopeSimple as Mail,
  MapPin,
  Medal,
  Monitor,
  // p
  Package,
  Palette,
  Archive as PackageOpen,
  Phone,
  Printer,
  // q–r
  QrCode,
  Receipt as ReceiptText,
  Rows as Rows3,
  Ruler,
  // s
  FloppyDisk as Save,
  MagnifyingGlassMinus as SearchX,
  GearSix as Settings,
  ShareNetwork as Share2,
  Shield,
  ShieldCheck,
  ShieldSlash as ShieldOff,
  TShirt as Shirt,
  ShoppingBag,
  DeviceMobile as Smartphone,
  DeviceTablet as Tablet,
  Sparkle as Sparkles,
  Star,
  Sword as Swords,
  // t
  Target,
  Warning as TriangleAlert,
  Trophy,
  TextT as Type,
  // u
  User,
  UserCircle as UserRound,
  Users,
  // w–z
  MagicWand as Wand2,
  XCircle,
  YoutubeLogo as Youtube,
} from '@phosphor-icons/react'

// Phosphor has no anvil — inlined (stroke path from lucide, ISC license) so
// the lucide dependency could be fully removed after the Phosphor verdict.
export function Anvil({
  size = 24,
  ...props
}: React.SVGProps<SVGSVGElement> & { size?: number | string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M7 10H6a4 4 0 0 1-4-4 1 1 0 0 1 1-1h4" />
      <path d="M7 5a1 1 0 0 1 1-1h13a1 1 0 0 1 1 1 7 7 0 0 1-7 7H8a1 1 0 0 1-1-1z" />
      <path d="M9 12v5" />
      <path d="M15 12v5" />
      <path d="M5 20a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3 1 1 0 0 1-1 1H6a1 1 0 0 1-1-1" />
    </svg>
  )
}

/** Component type for icon props/maps (was lucide's LucideIcon). */
export type { Icon as LucideIcon } from '@phosphor-icons/react'
