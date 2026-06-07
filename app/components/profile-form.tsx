'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import type { Profile, Role } from '@/utils/attendance'
import { BrandMark, Icon } from './icons'
import { LoadingState, Notice, PageHeader } from './ui'

export default function ProfileForm({ role }: { role: Role }) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({ name: '', identity: '' })

  useEffect(() => {
    const run = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.replace('/login')
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      const row = data as Profile | null
      setProfile(row)
      setForm({ name: row?.name ?? '', identity: role === 'dosen' ? (row?.nidn ?? '') : (row?.nim ?? '') })
      setLoading(false)
    }
    run()
  }, [role, router, supabase])

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!profile) return
    setSaving(true)
    setMessage('')
    setSuccess(false)
    const payload = { name: form.name.trim(), nim: role === 'mahasiswa' ? form.identity.trim() : null, nidn: role === 'dosen' ? form.identity.trim() : null }
    const { error } = await supabase.from('profiles').update(payload).eq('id', profile.id)
    if (error) {
      setMessage(`Gagal memperbarui profil: ${error.message}`)
    } else {
      await supabase.auth.updateUser({ data: payload })
      setProfile({ ...profile, ...payload })
      setMessage('Profil berhasil diperbarui.')
      setSuccess(true)
    }
    setSaving(false)
  }

  if (loading) return <LoadingState label="Memuat profil..." />

  return (
    <div className="mx-auto w-full max-w-8xl px-4 py-8 sm:px-6">
      
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <span className={`mt-6 flex h-24 w-24 items-center justify-center rounded-xl border text-3xl font-bold ${role === 'dosen' ? 'border-blue-100 bg-blue-50 text-blue-700' : 'border-emerald-100 bg-emerald-50 text-emerald-700'}`}>{form.name.charAt(0) || 'A'}</span>
            <h2 className="mt-5 text-xl font-bold text-slate-950">{profile?.name ?? 'Pengguna'}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">{profile?.email ?? '-'}</p>
            <span className="mt-4 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold capitalize text-slate-600">{role}</span>
          </div>
          <div className="mt-7 rounded-xl bg-slate-50 p-4">
            <div className="flex items-start gap-3"><Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><p className="text-xs font-semibold leading-5 text-slate-500">Informasi profil digunakan pada daftar kelas dan rekap absensi.</p></div>
          </div>
        </aside>
        <section className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="border-b border-slate-100 pb-5"><h2 className="text-xl font-bold text-slate-950">Informasi pribadi</h2><p className="mt-1 text-sm font-medium text-slate-500">Perbarui nama dan nomor identitas akademik.</p></div>
          <form onSubmit={save} className="mt-6 space-y-5">
            <label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">Nama lengkap</span><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100" /></label>
            <label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">{role === 'dosen' ? 'NIDN' : 'NIM'}</span><input required value={form.identity} onChange={(event) => setForm({ ...form, identity: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100" /></label>
            <label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">Email</span><input disabled value={profile?.email ?? ''} className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3.5 text-sm font-semibold text-slate-400" /><span className="mt-2 block text-xs font-medium text-slate-400">Email terhubung ke akun autentikasi dan tidak dapat diubah di sini.</span></label>
            {message && <Notice tone={success ? 'green' : 'red'}>{message}</Notice>}
            <div className="flex justify-end pt-2"><button disabled={saving} className={`inline-flex min-w-40 items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white transition disabled:opacity-60 ${role === 'dosen' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}><Icon name="check" className="h-4 w-4" />{saving ? 'Menyimpan...' : 'Simpan profil'}</button></div>
          </form>
        </section>
      </div>
    </div>
  )
}
