'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import type { Role } from '@/utils/attendance'
import { LoadingState } from '@/app/components/ui'

export default function ProfileRedirect() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const run = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.replace('/login')
      const role = (user.user_metadata?.role ?? 'mahasiswa') as Role
      router.replace(`/${role}/profile`)
    }
    run()
  }, [router, supabase])

  return <LoadingState label="Membuka profil..." />
}
