'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { formatClock, normalizeCode, one, statusLabel, type AttendanceRecord, type ClassRecord, type EnrollmentRecord, type MeetingRecord, type Profile } from '@/utils/attendance'

type EnrollmentWithClass = EnrollmentRecord & { classes: ClassRecord | ClassRecord[] | null }

export default function MahasiswaDashboard() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [studentId, setStudentId] = useState('')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [joinCode, setJoinCode] = useState('')
  const [message, setMessage] = useState('')
  const [myClasses, setMyClasses] = useState<EnrollmentWithClass[]>([])
  const [activeMeetings, setActiveMeetings] = useState<MeetingRecord[]>([])
  const [activeAttendance, setActiveAttendance] = useState<AttendanceRecord[]>([])

  const fetchMyClasses = useCallback(async (id: string) => {
    const { data, error } = await supabase.from('enrollments').select(`id, class_id, student_id, created_at, classes (id, teacher_id, course_name, code, created_at)`).eq('student_id', id).order('created_at', { ascending: false })
    if (error) return setMessage('Gagal memuat kelas.')
    const enrollments = (data ?? []) as EnrollmentWithClass[]
    setMyClasses(enrollments)
    const classIds = enrollments.map((item) => item.class_id)
    if (classIds.length === 0) return
    const { data: meetingData } = await supabase.from('meetings').select('*').eq('is_active', true).in('class_id', classIds).order('meeting_date', { ascending: false }).order('created_at', { ascending: false })
    const meetingRows = (meetingData ?? []) as MeetingRecord[]
    setActiveMeetings(meetingRows)
    const meetingIds = meetingRows.map((meeting) => meeting.id)
    if (meetingIds.length === 0) return
    const { data: attendanceData } = await supabase.from('attendance').select('*').eq('student_id', id).in('meeting_id', meetingIds)
    setActiveAttendance((attendanceData ?? []) as AttendanceRecord[])
  }, [supabase])

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')
      setStudentId(user.id)
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile((profileData as Profile | null) ?? null)
      await fetchMyClasses(user.id)
      setInitialLoading(false)
    }
    fetchData()
  }, [fetchMyClasses, router, supabase])

  const activeMeetingByClass = useMemo(() => { const map = new Map<string, MeetingRecord>(); activeMeetings.forEach((meeting) => { if (!map.has(meeting.class_id)) map.set(meeting.class_id, meeting) }); return map }, [activeMeetings])
  const attendanceByMeeting = useMemo(() => new Map(activeAttendance.map((item) => [item.meeting_id, item])), [activeAttendance])
  
  const stats = useMemo(() => {
    const attended = activeAttendance.filter((item) => item.status === 'present').length
    const late = activeAttendance.filter((item) => item.status === 'late').length
    return { classes: myClasses.length, active: activeMeetings.length, attended, late }
  }, [activeAttendance, activeMeetings.length, myClasses.length])

  const handleJoinKelas = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setMessage('')
    const code = normalizeCode(joinCode)
    if (!code) { setMessage('Masukkan kode kelas terlebih dahulu.'); setLoading(false); return }
    const { data: classData, error: classError } = await supabase.from('classes').select('id, course_name').eq('code', code).maybeSingle()
    if (classError || !classData) { setMessage('Kode kelas tidak ditemukan.'); setLoading(false); return }
    const { error: enrollError } = await supabase.from('enrollments').insert({ class_id: classData.id, student_id: studentId })
    if (enrollError) setMessage(enrollError.message.toLowerCase().includes('unique') ? 'Kamu sudah terdaftar di kelas ini.' : `Gagal: ${enrollError.message}`)
    else { setJoinCode(''); setMessage(`Berhasil bergabung ke ${classData.course_name}.`); await fetchMyClasses(studentId) }
    setLoading(false)
  }

  if (initialLoading) return <div className="flex min-h-[70vh] items-center justify-center"><div className="animate-pulse text-[var(--muted)] font-bold bg-[var(--panel)] p-6 rounded-xl">Memuat dashboard...</div></div>

  return (
    <div className="mx-auto w-full max-w-8xl px-4 py-8 sm:px-6">
      <header className="mb-8 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-8 ">
        <p className="text-sm font-md text-emerald-600 dark:text-emerald-400">Dashboard Mahasiswa</p>
        <h1 className="mt-2 text-xl md:text-2xl font-bold text-[var(--foreground)]">Selamat datang, {profile?.name ?? 'Mahasiswa'}</h1>
        <p className="mt-2 font-medium text-[var(--muted)]">Gabung kelas, pantau jadwal, dan jangan lupa absen!</p>
      </header>

      <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Kelas Diikuti', value: stats.classes, color: 'text-emerald-600' },
          { label: 'Sesi Aktif', value: stats.active, color: 'text-blue-600' },
          { label: 'Hadir', value: stats.attended, color: 'text-violet-600' },
          { label: 'Terlambat', value: stats.late, color: 'text-amber-600' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-5">
            <p className="text-xs font-bold text-[var(--muted)]">{stat.label}</p>
            <p className={`mt-2 text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </section>

      <section id="gabung-kelas" className="mb-8 scroll-mt-32 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-6 md:p-8 ">
        <h2 className="mb-4 text-2xl font-bold">Gabung Kelas Baru</h2>
        <form onSubmit={handleJoinKelas} className="flex flex-col sm:flex-row gap-4">
          <input type="text" required value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--panel-muted)] px-5 py-4 text-lg font-bold outline-none transition" placeholder="MASUKKAN KODE KELAS" maxLength={12} />
          <button type="submit" disabled={loading} className="rounded-xl bg-[var(--foreground)] px-8 py-4 font-bold text-[var(--background)] transition hover:opacity-80 disabled:opacity-60">
            {loading ? 'Mencari...' : 'Gabung'}
          </button>
        </form>
        {message && <p className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--panel-muted)] p-4 text-sm font-semibold">{message}</p>}
      </section>

      <section>
        <h2 className="mb-6 text-2xl font-bold">Kelas Saya</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {myClasses.map((item) => {
            const kelas = one(item.classes)
            const activeMeeting = activeMeetingByClass.get(item.class_id)
            const attendance = activeMeeting ? attendanceByMeeting.get(activeMeeting.id) : null

            return (
              <article key={item.id} className="flex flex-col justify-between rounded-xl border border-[var(--line)] bg-[var(--panel)] p-6 transition hover:border-emerald-300 ">
                <div>
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <h3 className="text-xl font-bold leading-tight text-[var(--foreground)]">{kelas?.course_name ?? 'Kelas'}</h3>
                    <span className={`shrink-0 rounded-md px-3 py-1 text-xs font-bold ${attendance?.status === 'present' ? 'bg-emerald-100 text-emerald-700' : attendance?.status === 'late' ? 'bg-amber-100 text-amber-700' : activeMeeting ? 'bg-blue-100 text-blue-700' : 'bg-[var(--panel-muted)] text-[var(--muted)]'}`}>
                      {activeMeeting ? statusLabel(attendance?.status) : 'Standby'}
                    </span>
                  </div>
                  
                  <div className="mb-6 rounded-lg bg-[var(--panel-muted)] p-4 border border-[var(--line)]">
                    <p className="text-xs font-bold  text-[var(--muted)]">Sesi Aktif</p>
                    <p className="mt-1 font-bold text-[var(--foreground)]">{activeMeeting?.title ?? 'Belum ada pertemuan'}</p>
                    {activeMeeting && (
                      <p className="mt-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {formatClock(activeMeeting.attendance_start)} - {formatClock(activeMeeting.attendance_end)}
                      </p>
                    )}
                  </div>
                </div>
                
                <button onClick={() => router.push(`/mahasiswa/kelas/${item.class_id}`)} className="w-full rounded-xl bg-emerald-500 px-4 py-3.5 font-bold text-white transition hover:bg-emerald-600">
                  Masuk Kelas &nbsp;&rarr;
                </button>
              </article>
            )
          })}
          {myClasses.length === 0 && <div className="col-span-full rounded-xl border border-dashed border-[var(--line)] bg-[var(--panel)] p-12 text-center text-lg font-bold text-[var(--muted)]">Belum ada kelas.</div>}
        </div>
      </section>
    </div>
  )
}
