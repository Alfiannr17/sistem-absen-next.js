'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setMessage('Email atau password belum sesuai.')
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-10 text-[var(--foreground)]">
      <div className="w-full max-w-md rounded-xl border border-[var(--line)] bg-[var(--panel)] p-8">
        
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-white">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Masuk Akun</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">Gunakan email dan password yang terdaftar.</p>
        </div>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <label className="space-y-1.5 text-sm font-semibold">
            <span>Email</span>
            <input 
              type="email" 
              placeholder="nama@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--panel-muted)] p-3.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </label>
          
          <label className="space-y-1.5 text-sm font-semibold">
            <span>Password</span>
            <input 
              type="password" 
              placeholder="Masukkan password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--panel-muted)] p-3.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </label>

          {message && (
            <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400" aria-live="polite">
              {message}
            </p>
          )}

          <button type="submit" disabled={loading} className="mt-2 w-full rounded-xl bg-blue-600 p-4 font-bold text-white transition hover:bg-blue-700 disabled:opacity-60">
            {loading ? 'Mengecek...' : 'Masuk Sistem'}
          </button>
        </form>
        
        <p className="mt-6 text-center text-sm font-medium text-[var(--muted)]">
          Belum punya akun?{' '}
          <Link href="/register" className="font-bold text-[var(--primary)] hover:underline">
            Daftar sekarang
          </Link>
        </p>
      </div>
    </main>
  )
}