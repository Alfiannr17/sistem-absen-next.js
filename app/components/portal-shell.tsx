'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import type { Role } from '@/utils/attendance'
import { BrandMark, Icon, type IconName } from './icons'

type NavItem = {
  label: string
  href: string
  icon: IconName
}

const navByRole: Record<Role, NavItem[]> = {
  dosen: [
    { label: 'Ringkasan', href: '/dosen/dashboard', icon: 'dashboard' },
    { label: 'Kelas', href: '/dosen/kelas', icon: 'book' },
    { label: 'Jadwal', href: '/dosen/jadwal', icon: 'calendar' },
    { label: 'Rekap', href: '/dosen/rekap', icon: 'trend' },
    { label: 'Profil', href: '/dosen/profile', icon: 'profile' },
  ],
  mahasiswa: [
    { label: 'Ringkasan', href: '/mahasiswa/dashboard', icon: 'dashboard' },
    { label: 'Kelas', href: '/mahasiswa/kelas', icon: 'book' },
    { label: 'Jadwal', href: '/mahasiswa/jadwal', icon: 'calendar' },
    { label: 'Riwayat', href: '/mahasiswa/riwayat', icon: 'activity' },
    { label: 'Profil', href: '/mahasiswa/profile', icon: 'profile' },
  ],
}

function isActive(pathname: string, href: string) {
  if (href.endsWith('/dashboard')) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function PortalShell({ children, role }: { children: React.ReactNode; role: Role }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)
  const [name, setName] = useState(role === 'dosen' ? 'Dosen' : 'Mahasiswa')
  const [identity, setIdentity] = useState('')
  const navItems = navByRole[role]
  const current = useMemo(() => navItems.find((item) => isActive(pathname, item.href)) ?? navItems[0], [navItems, pathname])
  const tone = role === 'dosen' ? 'blue' : 'emerald'
  const accent = role === 'dosen' ? 'text-blue-600 bg-blue-50 border-blue-100' : 'text-emerald-700 bg-emerald-50 border-emerald-100'

  useEffect(() => {
    const guardRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.replace('/login')
      const { data: profile } = await supabase.from('profiles').select('name, role, nim, nidn').eq('id', user.id).single()
      const userRole = (profile?.role ?? user.user_metadata?.role) as Role | undefined
      if (userRole !== role) return router.replace('/dashboard')
      setName(profile?.name ?? user.user_metadata?.name ?? (role === 'dosen' ? 'Dosen' : 'Mahasiswa'))
      setIdentity(role === 'dosen' ? (profile?.nidn ?? 'Portal dosen') : (profile?.nim ?? 'Portal mahasiswa'))
    }
    guardRole()
  }, [role, router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-24 items-center gap-3 border-b border-slate-100 px-7">
          <BrandMark tone={tone} />
          <div>
            <p className="text-lg font-bold text-slate-950">Sistem Absen</p>
            <p className="text-[11px] font-bold text-slate-400">Academic attendance</p>
          </div>
        </div>

        <div className="px-5 pt-4">
          
          <nav className=" space-y-1" aria-label={`Navigasi ${role}`}>
            {navItems.map((item) => {
              const active = isActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-2 rounded-xl border px-2 py-2 text-sm font-bold transition ${
                    active
                      ? accent
                      : 'border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${active ? 'bg-white' : 'bg-slate-50 group-hover:bg-white'}`}>
                    <Icon name={item.icon} className="h-5 w-5" />
                  </span>
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="mt-auto p-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex min-w-0 items-center gap-2">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-sm font-bold ${accent}`}>
                {name.charAt(0)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">{name}</p>
                <p className="truncate text-xs font-medium text-slate-500">{identity}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-red-50 px-3 py-2.5 text-xs font-bold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600">
              <Icon name="logout" className="h-4 w-4" />
              Keluar dari akun
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-7 lg:px-10">
            <div className="flex items-center gap-3">
              <button onClick={() => setMenuOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 lg:hidden" aria-label="Buka menu">
                <Icon name="menu" className="h-5 w-5" />
              </button>
              <div>
                <p className="text-[10px] font-bold text-slate-400">Portal {role}</p>
                <h1 className="text-lg font-bold text-slate-950">{current.label}</h1>
              </div>
            </div>
            <Link href={`/${role}/profile`} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 transition hover:border-slate-300">
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-bold ${accent}`}>{name.charAt(0)}</span>
              <span className="hidden max-w-40 truncate text-sm font-bold text-slate-700 sm:block">{name}</span>
            </Link>
          </div>
        </header>

        <main className="page-enter min-h-[calc(100vh-5rem)] pb-28 lg:pb-10">{children}</main>
      </div>

      <div className={`fixed inset-0 z-[60] bg-slate-950/30 backdrop-blur-sm transition lg:hidden ${menuOpen ? 'visible opacity-100' : 'invisible opacity-0'}`} onClick={() => setMenuOpen(false)}>
        <aside className={`h-full w-[86%] max-w-xs bg-white p-5 transition-transform duration-300 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`} onClick={(event) => event.stopPropagation()}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BrandMark tone={tone} />
              <div><p className="font-bold">Sistem Absen</p><p className="text-xs font-semibold text-slate-400">Portal {role}</p></div>
            </div>
            <button onClick={() => setMenuOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500" aria-label="Tutup menu"><Icon name="x" className="h-5 w-5" /></button>
          </div>
          <nav className="mt-8 space-y-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-sm font-bold ${isActive(pathname, item.href) ? accent : 'border-transparent text-slate-600'}`}>
                <Icon name={item.icon} className="h-5 w-5" />{item.label}
              </Link>
            ))}
          </nav>
          <button onClick={handleLogout} className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3.5 text-sm font-bold text-red-600"><Icon name="logout" className="h-5 w-5" />Keluar</button>
        </aside>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 rounded-xl border border-slate-200 bg-white/95 p-1.5 backdrop-blur-xl lg:hidden" aria-label={`Navigasi cepat ${role}`}>
        {navItems.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <Link key={item.href} href={item.href} className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-bold transition ${active ? (role === 'dosen' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700') : 'text-slate-400'}`}>
              <Icon name={item.icon} className="h-5 w-5" />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
