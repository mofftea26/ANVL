import { Link, type LinkProps } from '@tanstack/react-router'
import type { AnchorHTMLAttributes, ReactNode } from 'react'
import {
  adminForgedCtaLinkClass,
  adminForgedIconLinkClass,
  adminOutlineLinkClass,
} from '@/features/admin/components/adminForgedLinkStyles'
import { cn } from '@/shared/lib/cn'

type ForgedVariant = 'cta' | 'outline' | 'icon'

function forgedClass(variant: ForgedVariant, className?: string) {
  const base =
    variant === 'icon'
      ? adminForgedIconLinkClass
      : variant === 'outline'
        ? adminOutlineLinkClass
        : adminForgedCtaLinkClass
  return cn(base, variant === 'cta' && 'h-11 px-6', className)
}

type AdminForgedLinkBase = {
  children: ReactNode
  className?: string
  variant?: ForgedVariant
  title?: string
}

type AdminForgedRouterLinkProps = AdminForgedLinkBase &
  LinkProps & { href?: never }

type AdminForgedAnchorProps = AdminForgedLinkBase &
  AnchorHTMLAttributes<HTMLAnchorElement> & { to?: never }

export type AdminForgedLinkProps = AdminForgedRouterLinkProps | AdminForgedAnchorProps

export function AdminForgedLink({
  children,
  className,
  variant = 'cta',
  ...props
}: AdminForgedLinkProps) {
  const classes = forgedClass(variant, className)
  if ('to' in props && props.to != null) {
    const { to, ...rest } = props as AdminForgedRouterLinkProps
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    )
  }
  const anchorProps = props as AdminForgedAnchorProps
  return (
    <a className={classes} {...anchorProps}>
      {children}
    </a>
  )
}
