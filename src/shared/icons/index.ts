/**
 * ICON ABSTRACTION LAYER — the single seam between the app and its icon pack.
 *
 * Currently backed by **@phosphor-icons/react** (global weight set via
 * `PHOSPHOR_ICON_WEIGHT` + the IconContext mounted in AppProviders). Every
 * component imports icons from `@/shared/icons` using the historical
 * lucide-react names, mapped below to their Phosphor equivalents.
 *
 * REVERT PATH (lucide-react is still installed, on purpose): replace the
 * Phosphor re-exports below with
 *   `export { AlertTriangle, ArrowLeft, ... } from 'lucide-react'`
 * (names already match) and drop the IconContext from AppProviders. No call
 * site changes anywhere. Once a pack is FINAL, delete the loser from
 * package.json and this comment.
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

// Phosphor has no anvil — the brand-adjacent glyph stays on lucide.
export { Anvil } from 'lucide-react'

/** Component type for icon props/maps (was lucide's LucideIcon). */
export type { Icon as LucideIcon } from '@phosphor-icons/react'
