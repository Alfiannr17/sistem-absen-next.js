'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import {
  createClassCode,
  type ClassRecord,
  type EnrollmentRecord,
  type MeetingRecord,
  type Profile,
} from '@/utils/attendance'

export default function DosenDashboard() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [kelasList, setKelasList] = useState<ClassRecord[]>([])
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([])
  const [meetings, setMeetings] = useState<MeetingRecord[]>([])
  const [message, setMessage] = useState('')
  const [copiedCode, setCopiedCode] = useState('')
  const [courseName, setCourseName] = useState('')

  const syncDosenProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const profilePayload = {
      id: user.id,
      name: user.user_metadata?.name ?? profile?.name ?? 'Dosen',
      email: user.email ?? profile?.email ?? null,
      role: 'dosen',
      nim: null,
      nidn: user.user_metadata?.nidn ?? profile?.nidn ?? null,
    }
    const { error } = await supabase.from('profiles').upsert(profilePayload)
    if (error) {
      setMessage(`Gagal sinkron profil dosen: ${error.message}`)
      return null
    }
    setProfile(profilePayload as Profile)
    return user.id
  }, [profile, supabase])

  const fetchKelas = useCallback(async (id: string) => {
    const { data, error } = await supabase.from('classes').select('*').eq('teacher_id', id).order('created_at', { ascending: false })
    if (error) {
      setMessage(`Gagal memuat kelas: ${error.message}`)
      return
    }
    const classes = (data ?? []) as ClassRecord[]
    setKelasList(classes)
    const classIds = classes.map((kelas) => kelas.id)
    if (classIds.length === 0) {
      setEnrollments([])
      setMeetings([])
      return
    }
    const [{ data: enrollmentData }, { data: meetingData }] = await Promise.all([
      supabase.from('enrollments').select('id, class_id, student_id, created_at').in('class_id', classIds),
      supabase.from('meetings').select('*').in('class_id', classIds).order('meeting_date', { ascending: false }),
    ])
    setEnrollments((enrollmentData ?? []) as EnrollmentRecord[])
    setMeetings((meetingData ?? []) as MeetingRecord[])
  }, [supabase])

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile((profileData as Profile | null) ?? null)
      await fetchKelas(user.id)
      setInitialLoading(false)
    }
    fetchData()
  }, [fetchKelas, router, supabase])

  const classStats = useMemo(() => {
    const stats = new Map<string, { students: number; meetings: number; active: number }>()
    kelasList.forEach((kelas) => {
      stats.set(kelas.id, { students: 0, meetings: 0, active: 0 })
    })
    enrollments.forEach((item) => {
      const current = stats.get(item.class_id)
      if (current) current.students += 1
    })
    meetings.forEach((meeting) => {
      const current = stats.get(meeting.class_id)
      if (!current) return
      current.meetings += 1
      if (meeting.is_active) current.active += 1
    })
    return stats
  }, [enrollments, kelasList, meetings])

  const dashboardStats = useMemo(() => {
    return {
      classes: kelasList.length,
      students: enrollments.length,
      meetings: meetings.length,
      active: meetings.filter((meeting) => meeting.is_active).length,
    }
  }, [enrollments.length, kelasList.length, meetings])

  const handleBuatKelas = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    const currentTeacherId = await syncDosenProfile()
    if (!currentTeacherId) {
      setLoading(false)
      return
    }
    const code = createClassCode()
    const { error } = await supabase.from('classes').insert({
      teacher_id: currentTeacherId,
      course_name: courseName.trim(),
      code,
    })
    if (error) {
      setMessage(`Gagal membuat kelas: ${error.message}`)
    } else {
      setMessage(`Kelas berhasil dibuat. Kode kelas: ${code}`)
      setCourseName('')
      await fetchKelas(currentTeacherId)
    }
    setLoading(false)
  }

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(''), 1400)
  }

  if (initialLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-5">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] px-6 py-5 text-sm font-semibold text-[var(--muted)] animate-pulse">
          Memuat dashboard dosen...
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-8xl px-4 py-8 sm:px-6">
      
      <header id="ringkasan" className="scroll-mt-36 mb-8 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-8">
        <p className="text-sm font-bold text-[var(--primary)]">Dashboard Dosen</p>
        <h1 className="mt-2 text-3xl md:text-4xl font-bold text-[var(--foreground)]">Selamat datang, {profile?.name ?? 'Dosen'}</h1>
        <p className="mt-2 text-[var(--muted)] font-medium">Buat kelas dan pantau absensi mahasiswa dengan mudah.</p>
      </header>

      <section className="mb-8 grid scroll-mt-36 gap-5 md:grid-cols-4">
        {[
          { label: 'Total Kelas', value: dashboardStats.classes, color: 'text-blue-600' },
          { label: 'Mahasiswa', value: dashboardStats.students, color: 'text-emerald-600' },
          { label: 'Pertemuan', value: dashboardStats.meetings, color: 'text-purple-600' },
          { label: 'Absen Aktif', value: dashboardStats.active, color: 'text-amber-600' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-6 transition">
            <p className="text-sm font-semibold text-[var(--muted)]">{stat.label}</p>
            <p className={`mt-2 text-4xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </section>

      <section id="buat-kelas" className="mb-8 scroll-mt-36 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-6 md:p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Buat Kelas Baru</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Generate kode unik otomatis untuk mahasiswa.</p>
        </div>
        <form onSubmit={handleBuatKelas} className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] items-end">
          <label className="space-y-2 text-sm font-semibold">
            <span>Nama Mata Kuliah</span>
            <input 
              type="text" required value={courseName} onChange={(e) => setCourseName(e.target.value)}
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--panel-muted)] px-4 py-3.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Contoh: Pemrograman Web" 
            />
          </label>
          <button type="submit" disabled={loading} className="w-full md:w-auto rounded-xl bg-blue-600 px-8 py-3.5 font-bold text-white transition hover:bg-blue-700 disabled:opacity-60">
            {loading ? 'Membuat...' : '+ Generate Kelas'}
          </button>
        </form>
        {message && (
          <p className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-700 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-400" aria-live="polite">
            {message}
          </p>
        )}
      </section>

      <section id="kelas-saya" className="scroll-mt-36 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-6 md:p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Daftar Kelas Saya</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Kelola kelas dan aktifkan absensi dari detail kelas.</p>
        </div>
        <div className="grid gap-3 xl:hidden">
          {kelasList.map((kelas) => {
            const stats = classStats.get(kelas.id) ?? { students: 0, meetings: 0, active: 0 }
            return (
              <article key={kelas.id} className="rounded-xl border border-[var(--line)] bg-[var(--panel-muted)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-[var(--foreground)]">{kelas.course_name}</h3>
                    <button type="button" onClick={() => copyCode(kelas.code)} className="mt-2 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-700">
                      {copiedCode === kelas.code ? 'Kode disalin' : kelas.code}
                    </button>
                  </div>
                  <span className={`shrink-0 rounded-lg px-3 py-1 text-xs font-bold ${stats.active > 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    {stats.active > 0 ? `${stats.active} aktif` : 'Tidak aktif'}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 border-y border-[var(--line)] py-3 text-sm">
                  <div><p className="text-[var(--muted)]">Mahasiswa</p><p className="mt-1 font-bold">{stats.students}</p></div>
                  <div><p className="text-[var(--muted)]">Pertemuan</p><p className="mt-1 font-bold">{stats.meetings}</p></div>
                </div>
                <button onClick={() => router.push(`/dosen/kelas/${kelas.id}`)} className="mt-4 w-full rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white transition hover:bg-blue-700">
                  Kelola kelas
                </button>
              </article>
            )
          })}
          {kelasList.length === 0 && <p className="rounded-xl border border-dashed border-[var(--line)] p-8 text-center text-[var(--muted)]">Belum ada kelas yang dibuat.</p>}
        </div>
        <div className="hidden rounded-xl border border-[var(--line)] bg-[var(--panel)] xl:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--panel-muted)]">
              <tr className="border-b border-[var(--line)]">
                <th className="p-4 font-bold text-[var(--muted)]">Mata Kuliah</th>
                <th className="p-4 font-bold text-[var(--muted)]">Kode</th>
                <th className="p-4 font-bold text-[var(--muted)]">Mhs</th>
                <th className="p-4 font-bold text-[var(--muted)]">Sesi</th>
                <th className="p-4 font-bold text-[var(--muted)]">Status</th>
                <th className="p-4 font-bold text-right text-[var(--muted)]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {kelasList.map((kelas) => {
                const stats = classStats.get(kelas.id) ?? { students: 0, meetings: 0, active: 0 }
                return (
                  <tr key={kelas.id} className="transition hover:bg-[var(--panel-muted)]">
                    <td className="p-4 font-bold text-[var(--foreground)]">{kelas.course_name}</td>
                    <td className="p-4">
                      <button type="button" onClick={() => copyCode(kelas.code)} 
                        className="rounded-lg bg-blue-50 px-3 py-1.5 font-bold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300">
                        {copiedCode === kelas.code ? 'Disalin' : kelas.code}
                      </button>
                    </td>
                    <td className="p-4 font-semibold text-[var(--muted)]">{stats.students}</td>
                    <td className="p-4 font-semibold text-[var(--muted)]">{stats.meetings}</td>
                    <td className="p-4">
                      <span className={`inline-flex rounded-md px-3 py-1 text-xs font-bold ${
                        stats.active > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {stats.active > 0 ? `${stats.active} aktif` : 'Tidak aktif'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => router.push(`/dosen/kelas/${kelas.id}`)} 
                        className="rounded-xl bg-blue-600 px-5 py-2 font-bold text-white transition hover:bg-blue-700">
                        Kelola &rarr;
                      </button>
                    </td>
                  </tr>
                )
              })}
              {kelasList.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center font-medium text-[var(--muted)]">Belum ada kelas yang dibuat.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
