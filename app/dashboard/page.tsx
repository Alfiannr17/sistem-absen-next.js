'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import type { Role } from '@/utils/attendance'

export default function DashboardRedirect() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      const role = (profile?.role ?? user.user_metadata?.role) as Role | undefined
      if (role === 'dosen') router.push('/dosen/dashboard')
      else if (role === 'mahasiswa') router.push('/mahasiswa/dashboard')
      else router.push('/login')
    }
    checkUserRole()
  }, [router, supabase])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] px-8 py-6 animate-pulse">
        <p className="text-lg font-bold text-[var(--muted)]">Mengecek akses akun...</p>
      </div>
    </div>
  )
}