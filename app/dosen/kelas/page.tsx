'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import type { ClassRecord, EnrollmentRecord, MeetingRecord } from '@/utils/attendance'
import { Icon } from '@/app/components/icons'
import { EmptyState, LoadingState, PageHeader, SearchBox, StatCard } from '@/app/components/ui'

export default function DosenKelasPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [classes, setClasses] = useState<ClassRecord[]>([])
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([])
  const [meetings, setMeetings] = useState<MeetingRecord[]>([])

  const fetchData = useCallback(async (teacherId: string) => {
    const { data: classData } = await supabase.from('classes').select('*').eq('teacher_id', teacherId).order('created_at', { ascending: false })
    const rows = (classData ?? []) as ClassRecord[]
    setClasses(rows)
    const ids = rows.map((item) => item.id)
    if (ids.length) {
      const [{ data: enrollmentData }, { data: meetingData }] = await Promise.all([
        supabase.from('enrollments').select('id, class_id, student_id').in('class_id', ids),
        supabase.from('meetings').select('*').in('class_id', ids),
      ])
      setEnrollments((enrollmentData ?? []) as EnrollmentRecord[])
      setMeetings((meetingData ?? []) as MeetingRecord[])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    const run = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.replace('/login')
      await fetchData(user.id)
    }
    run()
  }, [fetchData, router, supabase])

  const stats = useMemo(() => {
    const map = new Map<string, { students: number; meetings: number; active: number }>()
    classes.forEach((item) => map.set(item.id, { students: 0, meetings: 0, active: 0 }))
    enrollments.forEach((item) => { const row = map.get(item.class_id); if (row) row.students += 1 })
    meetings.forEach((item) => { const row = map.get(item.class_id); if (row) { row.meetings += 1; if (item.is_active) row.active += 1 } })
    return map
  }, [classes, enrollments, meetings])

  const filtered = classes.filter((item) => `${item.course_name} ${item.code}`.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <LoadingState label="Memuat kelas dosen..." />

  return (
    <div className="mx-auto max-w-8xl space-y-6 px-6 py-8 sm:px-7 lg:px-6 lg:py-8">
      
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7">
        <div className="mb-6 flex  justify-between  sm:flex-row sm:items-center">
          <div><h2 className="text-xl font-bold text-slate-950">Daftar kelas</h2><p className="mt-1 text-sm font-medium text-slate-500">{filtered.length} kelas ditemukan</p></div>
          <div className="flex gap-4">
            <Link href="/dosen/dashboard#buat-kelas" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8  text-sm font-bold text-white transition hover:bg-blue-700">
              <span className="text-lg">+</span>Buat kelas
            </Link>
            <SearchBox value={search} onChange={setSearch} placeholder="Cari nama atau kode kelas..." />
            
          </div>
          
        </div>
        {filtered.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((kelas) => {
              const row = stats.get(kelas.id) ?? { students: 0, meetings: 0, active: 0 }
              return (
                <article key={kelas.id} className="group rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-blue-300 hover:bg-blue-50/20">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600"><Icon name="book" className="h-5 w-5" /></span>
                    <span className={`rounded-xl px-3 py-1 text-[11px] font-bold ${row.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{row.active ? 'Sesi aktif' : 'Standby'}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-slate-950">{kelas.course_name}</h3>
                  <p className="mt-1 text-sm font-bold text-blue-600">{kelas.code}</p>
                  <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3">
                    <div><p className="text-[10px] font-bold text-slate-400">Mahasiswa</p><p className="mt-1 font-bold text-slate-800">{row.students}</p></div>
                    <div><p className="text-[10px] font-bold text-slate-400">Pertemuan</p><p className="mt-1 font-bold text-slate-800">{row.meetings}</p></div>
                  </div>
                  <Link href={`/dosen/kelas/${kelas.id}`} className="mt-4 flex items-center justify-between rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition group-hover:bg-blue-600">Kelola kelas <Icon name="arrow" className="h-4 w-4" /></Link>
                </article>
              )
            })}
          </div>
        ) : <EmptyState icon="book" title="Kelas belum ditemukan" description={search ? 'Coba gunakan kata kunci lain.' : 'Buat kelas pertama dari dashboard untuk mulai mengelola absensi.'} />}
      </section>
    </div>
  )
}
