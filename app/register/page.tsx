'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Role } from '@/utils/attendance'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState<Role>('mahasiswa')
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', nim: '', nidn: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setSuccess('')
    
    const profilePayload = {
      name: formData.name.trim(),
      role,
      email: formData.email.trim(),
      nim: role === 'mahasiswa' ? formData.nim.trim() : null,
      nidn: role === 'dosen' ? formData.nidn.trim() : null,
    }

    const { data, error } = await supabase.auth.signUp({
      email: profilePayload.email,
      password: formData.password,
      options: {
        data: {
          name: profilePayload.name,
          role: profilePayload.role,
          nim: profilePayload.nim,
          nidn: profilePayload.nidn,
        }
      }
    })

    if (error) {
      setMessage(error.message)
    } else {
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          ...profilePayload,
        })
      }
      setSuccess('Registrasi berhasil. Silakan masuk memakai akun baru.')
      setTimeout(() => router.push('/login'), 1200)
    }
    setLoading(false)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-10 text-[var(--foreground)]">
      <div className="w-full max-w-lg rounded-xl border border-[var(--line)] bg-[var(--panel)] p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-white">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Daftar Akun</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">Pilih role sesuai status kamu saat ini.</p>
        </div>
        
        <form onSubmit={handleRegister} className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-[var(--line)] bg-[var(--panel-muted)] p-1.5">
            {(['mahasiswa', 'dosen'] as Role[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRole(item)}
                className={`rounded-lg px-3 py-2.5 text-sm font-bold transition-all ${
                  role === item
                    ? 'bg-blue-600 text-white'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                {item === 'mahasiswa' ? 'Mahasiswa' : 'Dosen'}
              </button>
            ))}
          </div>

          <label className="space-y-1.5 text-sm font-semibold">
            <span>Nama Lengkap</span>
            <input type="text" name="name" placeholder="Nama lengkap" value={formData.name} onChange={handleChange} required className="w-full rounded-xl border border-[var(--line)] bg-[var(--panel-muted)] p-3.5 outline-none transition focus:border-blue-500 focus:bg-[var(--panel)] focus:ring-2 focus:ring-blue-500/20" />
          </label>

          <label className="space-y-1.5 text-sm font-semibold">
            <span>{role === 'mahasiswa' ? 'NIM' : 'NIDN'}</span>
            <input type="text" name={role === 'mahasiswa' ? 'nim' : 'nidn'} placeholder={role === 'mahasiswa' ? 'Nomor Induk Mahasiswa' : 'Nomor Induk Dosen Nasional'} value={role === 'mahasiswa' ? formData.nim : formData.nidn} onChange={handleChange} required className="w-full rounded-xl border border-[var(--line)] bg-[var(--panel-muted)] p-3.5 outline-none transition focus:border-blue-500 focus:bg-[var(--panel)] focus:ring-2 focus:ring-blue-500/20" />
          </label>

          <label className="space-y-1.5 text-sm font-semibold">
            <span>Email</span>
            <input type="email" name="email" placeholder="nama@email.com" value={formData.email} onChange={handleChange} required className="w-full rounded-xl border border-[var(--line)] bg-[var(--panel-muted)] p-3.5 outline-none transition focus:border-blue-500 focus:bg-[var(--panel)] focus:ring-2 focus:ring-blue-500/20" />
          </label>

          <label className="space-y-1.5 text-sm font-semibold">
            <span>Password</span>
            <input type="password" name="password" placeholder="Minimal 6 karakter" value={formData.password} onChange={handleChange} required minLength={6} className="w-full rounded-xl border border-[var(--line)] bg-[var(--panel-muted)] p-3.5 outline-none transition focus:border-blue-500 focus:bg-[var(--panel)] focus:ring-2 focus:ring-blue-500/20" />
          </label>

          {message && <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400" aria-live="polite">{message}</p>}
          {success && <p className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400" aria-live="polite">{success}</p>}

          <button type="submit" disabled={loading} className="mt-2 w-full rounded-xl bg-blue-600 p-4 font-bold text-white transition hover:bg-blue-700 disabled:opacity-60">
            {loading ? 'Memproses...' : 'Daftar Sekarang'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm font-medium text-[var(--muted)]">
          Sudah punya akun?{' '}
          <Link href="/login" className="font-bold text-[var(--primary)] hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </main>
  )
}   
