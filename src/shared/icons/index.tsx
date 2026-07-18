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
 */

/** Site-wide Phosphor weight — flip to 'regular' | 'bold' | 'fill' to taste. */
export const PHOSPHOR_ICON_WEIGHT = 'duotone' as const

export {
  // a
  Warning as AlertTriangle,
  ArrowsDownUp as ArrowDownUp,
  ArrowLeft,
  ArrowsLeftRight as ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
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
  Check,
  Circle,
  CaretDown as ChevronDown,
  CaretLeft as ChevronLeft,
  CaretRight as ChevronRight,
  CaretUp as ChevronUp,
  Copy,
  Crosshair,
  Crown,
  // d
  Database,
  DownloadSimple as Download,
  // e
  ArrowsOutSimple as Expand,
  ArrowSquareOut as ExternalLink,
  Eye,
  EyeSlash as EyeOff,
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
  CircleNotch as Loader2,
  Lock,
  SignOut as LogOut,
  // m
  EnvelopeSimple as Mail,
  MapPin,
  Medal,
  List as Menu,
  Minus,
  Monitor,
  // p
  Package,
  Palette,
  Archive as PackageOpen,
  PencilSimple as Pencil,
  Phone,
  Plus,
  Printer,
  // q–r
  QrCode,
  Receipt as ReceiptText,
  ArrowsClockwise as RefreshCw,
  ArrowCounterClockwise as RotateCcw,
  Rows as Rows3,
  Ruler,
  // s
  FloppyDisk as Save,
  MagnifyingGlass as Search,
  MagnifyingGlassMinus as SearchX,
  GearSix as Settings,
  ShareNetwork as Share2,
  Shield,
  ShieldCheck,
  ShieldSlash as ShieldOff,
  TShirt as Shirt,
  ShoppingBag,
  SlidersHorizontal,
  DeviceMobile as Smartphone,
  DeviceTablet as Tablet,
  Sparkle as Sparkles,
  Star,
  Sword as Swords,
  // t
  Target,
  Trash as Trash2,
  Warning as TriangleAlert,
  Trophy,
  TextT as Type,
  // u
  UploadSimple as Upload,
  User,
  UserCircle as UserRound,
  Users,
  // w–z
  MagicWand as Wand2,
  X,
  XCircle,
  YoutubeLogo as Youtube,
  MagnifyingGlassPlus as ZoomIn,
  MagnifyingGlassMinus as ZoomOut,
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
