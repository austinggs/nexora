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

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const active = (href: string) => pathname === href || (href !== '/app' && pathname.startsWith(href))

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/app"><span className="brand-mark" />NEXORA</Link>
        <nav className="nav">
          {items.map(({ href, label, icon: Icon }) => <Link key={href} className={active(href) ? 'active' : ''} href={href}><Icon size={18} />{label}</Link>)}
          <Link href="/app/notifications"><Bell size={18} />Pings</Link>
          <Link href="/app/profile"><UserRound size={18} />Profile</Link>
        </nav>
        <div className="sidebar-spacer" />
        <div className="profile-mini">
          <div style={{display:'flex',alignItems:'center',gap:10}}><div className="avatar">NX</div><div><strong style={{fontSize:13}}>Nexorian</strong><div className="muted" style={{fontSize:11}}>Verified member</div></div></div>
        </div>
      </aside>
      <main className="main">{children}</main>
      <nav className="mobile-nav">
        {items.map(({ href, label, icon: Icon }) => <Link key={href} className={active(href) ? 'active' : ''} href={href}><Icon size={18}/><span>{label}</span></Link>)}
      </nav>
    </div>
  )
}

export function TopActions() {
  return <div style={{display:'flex',gap:8}}><button className="btn secondary" aria-label="Search"><Search size={17}/></button><Link className="btn secondary" href="/app/notifications"><Bell size={17}/></Link></div>
}
