'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, CircleDollarSign, Compass, Gamepad2, Home, Search, UserRound, WalletCards } from 'lucide-react'

const items = [
  { href: '/app', label: 'Home', icon: Home },
  { href: '/app/explore', label: 'Explore', icon: Compass },
  { href: '/app/earn', label: 'Earn', icon: CircleDollarSign },
  { href: '/app/wallet', label: 'Wallet', icon: WalletCards },
  { href: '/app/mining', label: 'Mining', icon: Gamepad2 },
]

type ShellIdentity = {
  displayName: string
  username: string | null
  initials: string
  verified: boolean
}

export function AppShell({ children, identity }: { children: React.ReactNode; identity?: ShellIdentity | null }) {
  const pathname = usePathname()
  const active = (href: string) => pathname === href || (href !== '/app' && pathname.startsWith(href))
  const displayName = identity?.displayName || 'Nexorian'
  const subtitle = identity?.username ? `@${identity.username}` : identity?.verified ? 'Verified member' : 'NEXORA member'
  const initials = identity?.initials || displayName.slice(0, 2).toUpperCase()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/app" aria-label="NEXORA home"><span className="brand-mark" />NEXORA</Link>
        <nav className="nav" aria-label="Primary navigation">
          {items.map(({ href, label, icon: Icon }) => (
            <Link key={href} className={active(href) ? 'active' : ''} href={href} aria-current={active(href) ? 'page' : undefined}>
              <Icon size={18} aria-hidden="true" />{label}
            </Link>
          ))}
          <Link className={active('/app/notifications') ? 'active' : ''} href="/app/notifications" aria-current={active('/app/notifications') ? 'page' : undefined}>
            <Bell size={18} aria-hidden="true" />Pings
          </Link>
          <Link className={active('/app/profile') ? 'active' : ''} href="/app/profile" aria-current={active('/app/profile') ? 'page' : undefined}>
            <UserRound size={18} aria-hidden="true" />Profile
          </Link>
        </nav>
        <div className="sidebar-spacer" />
        <Link className="profile-mini" href="/app/profile" aria-label={`Open profile for ${displayName}`}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div className="avatar" aria-hidden="true">{initials}</div>
            <div style={{minWidth:0}}>
              <strong style={{fontSize:13,display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{displayName}</strong>
              <div className="muted" style={{fontSize:11,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{subtitle}</div>
            </div>
          </div>
        </Link>
      </aside>
      <main className="main">{children}</main>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {items.map(({ href, label, icon: Icon }) => (
          <Link key={href} className={active(href) ? 'active' : ''} href={href} aria-current={active(href) ? 'page' : undefined}>
            <Icon size={18} aria-hidden="true" /><span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}

export function TopActions() {
  return (
    <div className="top-actions">
      <Link className="btn secondary icon-btn" href="/app/explore" aria-label="Search community" title="Search community"><Search size={17} aria-hidden="true" /></Link>
      <Link className="btn secondary icon-btn" href="/app/notifications" aria-label="Open notifications" title="Open notifications"><Bell size={17} aria-hidden="true" /></Link>
    </div>
  )
}
